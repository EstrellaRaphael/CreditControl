import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, writeBatch, doc, increment, getDocs } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of, combineLatest, map, forkJoin, take } from 'rxjs';
import { Parcela } from '../models/core.types';
import { CartaoService } from './cartao';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private cartaoService = inject(CartaoService);

  // Busca as parcelas de um mês/ano específico em tempo real
  getParcelasDoMes(mes: number, ano: number): Observable<Parcela[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);

        return new Observable<Parcela[]>(observer => {
          const parcelasRef = collection(this.firestore, `users/${user.uid}/parcelas`);

          // Query composta: Filtra por Mês E Ano
          // Nota: Isso exige um índice composto no Firebase (que você já criou)
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

          // Função de limpeza quando o componente for destruído ou o mês mudar
          return () => unsubscribe();
        });
      })
    );
  }

  // Busca dados completos para o Dashboard (Cartões + Parcelas do Mês)
  // Usa combineLatest para esperar os dois dados chegarem antes de mostrar na tela
  getDashboardData(mes: number, ano: number) {
    return combineLatest([
      this.cartaoService.getCartoes(),      // Traz todos os cartões (para calcular limite global)
      this.getParcelasDoMes(mes, ano)       // Traz as parcelas filtradas do mês
    ]).pipe(
      map(([cartoes, parcelas]) => {
        return {
          cartoes,
          parcelas
        };
      })
    );
  }

  getHistorico(mesAtual: number, anoAtual: number): Observable<{ name: string, value: number }[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);

        // OTIMIZAÇÃO: Busca um range de datas de uma vez só
        // Define o intervalo (Últimos 6 meses)
        const hoje = new Date();
        const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); // Fim deste mês
        const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1); // 5 meses atrás

        const parcelasRef = collection(this.firestore, `users/${user.uid}/parcelas`);
        // Note: Precisamos de um índice composto: userId + dataVencimento
        const q = query(
          parcelasRef,
          where('dataVencimento', '>=', dataInicio.toISOString().split('T')[0]),
          where('dataVencimento', '<=', dataFim.toISOString().split('T')[0])
        );

        return new Observable<{ name: string, value: number }[]>(observer => {
          getDocs(q).then(snapshot => {
            // Agregação em Memória
            const mapStats = new Map<string, number>();

            // Inicializa os 6 meses com 0 para garantir que apareçam no gráfico
            for (let i = 5; i >= 0; i--) {
              let m = mesAtual - i;
              let a = anoAtual;
              if (m <= 0) { m += 12; a -= 1; }
              if (m > 12) { m -= 12; a += 1; }
              const key = `${m}/${a}`;
              mapStats.set(key, 0);
            }

            snapshot.forEach(doc => {
              const p = doc.data() as Parcela;
              const key = `${p.mesReferencia}/${p.anoReferencia}`;
              if (mapStats.has(key)) {
                mapStats.set(key, (mapStats.get(key) || 0) + p.valor);
              }
            });

            // Formata para o gráfico
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

  // Helper simples para nome curto (Jan, Fev...)
  private getNomeMesAbreviado(mes: number): string {
    const data = new Date(2024, mes - 1, 1);
    return data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
  }

  async pagarFaturaMensal(mes: number, ano: number) {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não logado');

    const batch = writeBatch(this.firestore);
    const parcelasRef = collection(this.firestore, `users/${user.uid}/parcelas`);

    // Busca apenas as parcelas deste mês que ainda estão PENDENTES
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

      // 1. Marca a parcela como PAGO (Igual antes)
      batch.update(documento.ref, { status: 'PAGO' });

      // 2. Restaura o limite do cartão (Igual antes)
      const cartaoRef = doc(this.firestore, `users/${user.uid}/cartoes/${dados.cartaoId}`);
      batch.update(cartaoRef, {
        usado: increment(-dados.valor)
      });

      // 3. NOVO: Incrementa o contador na Compra Pai
      if (dados.compraId) {
        const compraRef = doc(this.firestore, `users/${user.uid}/compras/${dados.compraId}`);
        batch.update(compraRef, {
          parcelasPagas: increment(1)
        });
      }
    });

    await batch.commit();
    return snapshot.size; // Retorna quantas parcelas foram pagas
  }

  // NOVO: Pagar uma parcela individual
  async pagarParcelaIndividual(parcela: Parcela) {
    const user = this.authService.getCurrentUser();
    if (!user || !parcela.id) throw new Error('Dados inválidos');

    const batch = writeBatch(this.firestore);

    // 1. Marca a parcela como PAGO
    const parcelaRef = doc(this.firestore, `users/${user.uid}/parcelas/${parcela.id}`);
    batch.update(parcelaRef, { status: 'PAGO' });

    // 2. Restaura o limite do cartão
    const cartaoRef = doc(this.firestore, `users/${user.uid}/cartoes/${parcela.cartaoId}`);
    batch.update(cartaoRef, {
      usado: increment(-parcela.valor)
    });

    // 3. Incrementa o contador na Compra Pai
    if (parcela.compraId) {
      const compraRef = doc(this.firestore, `users/${user.uid}/compras/${parcela.compraId}`);
      batch.update(compraRef, {
        parcelasPagas: increment(1)
      });
    }

    return batch.commit();
  }
}



