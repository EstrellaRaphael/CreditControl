import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, writeBatch, doc, increment, getDocs, limit, getDoc } from '@angular/fire/firestore';
import { HouseholdService } from './household.service';
import { CompraService } from './compra';
import { Observable, switchMap, of, combineLatest, map } from 'rxjs';
import { Parcela, Compra } from '../models/core.types';
import { CartaoService } from './cartao';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private firestore = inject(Firestore);
  private householdService = inject(HouseholdService);
  private cartaoService = inject(CartaoService);
  private compraService = inject(CompraService);

  /**
   * Busca as parcelas de um mês/ano específico em tempo real.
   */
  getParcelasDoMes(mes: number, ano: number): Observable<Parcela[]> {
    return this.householdService.householdId$.pipe(
      switchMap(householdId => {
        if (!householdId) return of([]);

        return new Observable<Parcela[]>(observer => {
          const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);
          const q = query(
            parcelasRef,
            where('mesReferencia', '==', mes),
            where('anoReferencia', '==', ano)
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const parcelas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Parcela));
            observer.next(parcelas);
          }, (error) => {
            console.error("Erro ao buscar parcelas:", error);
            observer.error(error);
          });

          return () => unsubscribe();
        });
      })
    );
  }

  /**
   * Busca dados completos para o Dashboard (Cartões + Parcelas do Mês).
   */
  getDashboardData(mes: number, ano: number) {
    const start = `${ano}-${mes.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(ano, mes, 0).getDate();
    const end = `${ano}-${mes.toString().padStart(2, '0')}-${lastDay}`;

    return combineLatest([
      this.cartaoService.getCartoes(),
      this.getParcelasDoMes(mes, ano),
      this.householdService.getMembers(),
      this.compraService.getCompras(start, end)
    ]).pipe(
      map(([cartoes, parcelas, members, compras]) => ({ cartoes, parcelas, members, compras }))
    );
  }

  /**
   * Busca histórico dos últimos 6 meses.
   */
  getHistorico(mesAtual: number, anoAtual: number): Observable<{ name: string, value: number }[]> {
    return this.householdService.householdId$.pipe(
      switchMap(householdId => {
        if (!householdId) return of([]);

        const hoje = new Date();
        const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);

        const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);
        const q = query(
          parcelasRef,
          where('dataVencimento', '>=', dataInicio.toISOString().split('T')[0]),
          where('dataVencimento', '<=', dataFim.toISOString().split('T')[0])
        );

        return new Observable<{ name: string, value: number }[]>(observer => {
          getDocs(q).then(snapshot => {
            const mapStats = new Map<string, number>();

            // Inicializa os 6 meses com 0
            for (let i = 5; i >= 0; i--) {
              let m = mesAtual - i;
              let a = anoAtual;
              if (m <= 0) { m += 12; a -= 1; }
              if (m > 12) { m -= 12; a += 1; }
              mapStats.set(`${m}/${a}`, 0);
            }

            snapshot.forEach(doc => {
              const p = doc.data() as Parcela;
              const key = `${p.mesReferencia}/${p.anoReferencia}`;
              if (mapStats.has(key)) {
                mapStats.set(key, (mapStats.get(key) || 0) + p.valor);
              }
            });

            const result = Array.from(mapStats.entries()).map(([key, valor]) => {
              const [m, a] = key.split('/').map(Number);
              return {
                name: `${this.getNomeMesAbreviado(m)}/${a.toString().slice(-2)}`,
                value: valor
              };
            });

            observer.next(result);
            observer.complete();
          }).catch(err => observer.error(err));
        });
      })
    );
  }

  private getNomeMesAbreviado(mes: number): string {
    const data = new Date(2024, mes - 1, 1);
    return data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
  }

  /**
   * Paga todas as parcelas pendentes de um mês.
   */
  async pagarFaturaMensal(mes: number, ano: number) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) throw new Error('Household não encontrado');

    if (!this.householdService.hasPermission('payInvoices')) {
      throw new Error('Você não tem permissão para pagar faturas');
    }

    const batch = writeBatch(this.firestore);
    const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);

    const q = query(
      parcelasRef,
      where('mesReferencia', '==', mes),
      where('anoReferencia', '==', ano),
      where('status', '==', 'PENDENTE')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    snapshot.forEach((documento) => {
      const dados = documento.data() as Parcela;

      // Marca como PAGO
      batch.update(documento.ref, { status: 'PAGO' });

      // Restaura limite do cartão
      const cartaoRef = doc(this.firestore, `households/${householdId}/cartoes/${dados.cartaoId}`);
      batch.update(cartaoRef, { usado: increment(-dados.valor) });

      // Incrementa contador na Compra Pai
      if (dados.compraId) {
        const compraRef = doc(this.firestore, `households/${householdId}/compras/${dados.compraId}`);
        batch.update(compraRef, { parcelasPagas: increment(1) });
      }
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Paga uma parcela individual.
   */
  async pagarParcelaIndividual(parcela: Parcela) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId || !parcela.id) throw new Error('Dados inválidos');

    if (!this.householdService.hasPermission('payInvoices')) {
      throw new Error('Você não tem permissão para pagar parcelas');
    }

    const batch = writeBatch(this.firestore);

    // Marca como PAGO
    const parcelaRef = doc(this.firestore, `households/${householdId}/parcelas/${parcela.id}`);
    batch.update(parcelaRef, { status: 'PAGO' });

    // Restaura limite do cartão
    const cartaoRef = doc(this.firestore, `households/${householdId}/cartoes/${parcela.cartaoId}`);
    batch.update(cartaoRef, { usado: increment(-parcela.valor) });

    // Incrementa contador na Compra Pai
    if (parcela.compraId) {
      const compraRef = doc(this.firestore, `households/${householdId}/compras/${parcela.compraId}`);
      batch.update(compraRef, { parcelasPagas: increment(1) });
    }

    return batch.commit();
  }
  /**
   * REPARO: Corrige parcelas antigas que ficaram sem userId.
   * Busca parcelas sem usuário, consulta a compra original e atualiza.
   */
  async repairParcelasSemUser() {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) return;

    // 1. Busca todas as parcelas (Idealmente filtraria por userId == '', mas Firestore não suporta vazio em index as vezes)
    // Vamos buscar as do mês atual que vieram zeradas no dashboard, mas aqui vamos pegar um lote
    // Para simplificar, vamos buscar parcelas onde userId == '' via query
    const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);
    const q = query(parcelasRef, where('userId', '==', ''), limit(50)); // Faz em lotes para não travar
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    console.log(`[Repair] Encontradas ${snapshot.size} parcelas sem usuário.`);
    const batch = writeBatch(this.firestore);
    const comprasCache = new Map<string, string>(); // compraId -> userId

    for (const docSnap of snapshot.docs) {
      const p = docSnap.data() as Parcela;
      if (!p.compraId) continue;

      let userId = comprasCache.get(p.compraId);

      if (!userId) {
        // Busca a compra pai
        const compraRef = doc(this.firestore, `households/${householdId}/compras/${p.compraId}`);
        const compraSnap = await getDoc(compraRef);
        if (compraSnap.exists()) {
          const compra = compraSnap.data() as Compra;
          userId = compra.createdBy || compra.userId; // Tenta pegar de createdBy
          if (userId) comprasCache.set(p.compraId, userId);
        }
      }

      if (userId) {
        batch.update(docSnap.ref, { userId: userId });
      }
    }

    await batch.commit();
    console.log(`[Repair] ${snapshot.size} parcelas corrigidas.`);
  }
}
