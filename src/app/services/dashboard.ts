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
    const mesesParaBuscar = [];

    // 1. Calcula os últimos 6 meses (incluindo o atual)
    for (let i = 5; i >= 0; i--) {
      let mes = mesAtual - i;
      let ano = anoAtual;

      if (mes <= 0) {
        mes += 12;
        ano -= 1;
      }
      mesesParaBuscar.push({ mes, ano });
    }

    // 2. Cria um array de Observables (6 chamadas paralelas)
    const requests = mesesParaBuscar.map(data => {
      // Reutiliza o getParcelasDoMes, mas pega apenas 1 vez (take 1) para não manter 6 conexões abertas
      return this.getParcelasDoMes(data.mes, data.ano).pipe(
        take(1),
        map(parcelas => {
          // Soma o total daquele mês
          const total = parcelas.reduce((acc, p) => acc + p.valor, 0);
          // Retorna no formato que o gráfico gosta
          return {
            name: `${this.getNomeMesAbreviado(data.mes)}/${data.ano.toString().slice(-2)}`,
            value: total
          };
        })
      );
    });

    // 3. Executa todas as 6 requisições em paralelo e devolve o array ordenado
    return forkJoin(requests);
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
}



