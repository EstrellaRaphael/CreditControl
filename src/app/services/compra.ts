import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  writeBatch,
  doc,
  query,
  orderBy,
  onSnapshot,
  increment,
  getDoc,
  where, getDocs, limit
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of, firstValueFrom } from 'rxjs';
import { Compra, Cartao, Parcela } from '../models/core.types';
import { InstallmentCalculator } from '../utils/installment-calculator';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Lista compras em tempo real (ordenadas por data)
  getCompras(start?: string, end?: string): Observable<Compra[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);

        return new Observable<Compra[]>(observer => {
          const comprasRef = collection(this.firestore, `users/${user.uid}/compras`);

          let constraints: any[] = [orderBy('dataCompra', 'desc')];

          if (start) {
            constraints.push(where('dataCompra', '>=', start));
          }
          if (end) {
            constraints.push(where('dataCompra', '<=', end));
          }

          // Se não tiver filtro de data, limita a 100 para não travar
          if (!start && !end) {
            constraints.push(limit(100));
          }

          const q = query(comprasRef, ...constraints);

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const compras = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Compra));
            observer.next(compras);
          });
          return () => unsubscribe();
        });
      })
    );
  }

  // O GRANDE MÉTODO: Salva Compra + Gera Parcelas + Atualiza Cartão
  async addCompra(compra: Omit<Compra, 'id' | 'userId'>, cartao: Cartao) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) throw new Error('Usuário não autenticado');

    // 1. Inicializa o Batch (Lote de gravações)
    const batch = writeBatch(this.firestore);

    // 2. Prepara a Compra
    const compraId = doc(collection(this.firestore, 'dummy')).id; // Gera ID manual
    const compraRef = doc(this.firestore, `users/${user.uid}/compras/${compraId}`);

    const novaCompra: Compra = {
      ...compra,
      id: compraId,
      userId: user.uid,
      // Denormalização para facilitar exibição (salvamos nome/cor do cartão na compra)
      cartaoNome: cartao.nome,
      cartaoCor: cartao.cor,
      parcelasPagas: 0
    };

    batch.set(compraRef, novaCompra);

    // 3. Lógica de Parcelas (RN002 e RN003)
    const parcelas = InstallmentCalculator.calculate(novaCompra, cartao, user.uid, compraId);

    // Adiciona cada parcela no Batch
    parcelas.forEach(parcela => {
      const parcelaRef = doc(collection(this.firestore, `users/${user.uid}/parcelas`));
      batch.set(parcelaRef, parcela);
    });

    // 4. Atualiza o saldo "Usado" do Cartão
    // Recorrentes não consomem o limite total de uma vez, apenas parcelados/avista consomem
    const cartaoRef = doc(this.firestore, `users/${user.uid}/cartoes/${cartao.id}`);
    batch.update(cartaoRef, {
      usado: (cartao.usado || 0) + compra.valorTotal
    });


    // 5. Executa tudo atomicamente
    return batch.commit();
  }

  async deleteCompra(compra: Compra) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user || !compra.id) return;

    const batch = writeBatch(this.firestore);

    // 1. Deletar a compra (Pai)
    const compraRef = doc(this.firestore, `users/${user.uid}/compras/${compra.id}`);
    batch.delete(compraRef);

    // 2. Buscar e Deletar as Parcelas (Filhas)
    const parcelasRef = collection(this.firestore, `users/${user.uid}/parcelas`);
    const q = query(parcelasRef, where('compraId', '==', compra.id));

    const parcelasSnapshot = await getDocs(q);
    parcelasSnapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });

    // 3. Estornar valor do cartão (CORREÇÃO DO BUG)
    if (compra.cartaoId) {
      const cartaoRef = doc(this.firestore, `users/${user.uid}/cartoes/${compra.cartaoId}`);
      const cartaoSnap = await getDoc(cartaoRef);

      if (cartaoSnap.exists()) {

        // LÓGICA NOVA: Calcular quanto falta pagar para não estornar em dobro
        let valorParaEstornar = compra.valorTotal;

        // Se já tiver parcelas pagas, descontamos do valor a ser devolvido
        if (compra.parcelasPagas && compra.parcelasPagas > 0) {
          // Define o divisor correto (Recorrente consideramos 12 meses na geração, mas aqui o objeto pode ter salvo 1)
          // Para parcelado normal, usa a qtdParcelas salva.
          const totalParcelas = compra.tipo === 'recorrente' ? 12 : (compra.qtdParcelas || 1);

          // Regra de 3: Quanto do valor total já foi pago?
          const valorJaPago = (compra.valorTotal / totalParcelas) * compra.parcelasPagas;

          valorParaEstornar = compra.valorTotal - valorJaPago;
        }

        // Garante que não vai dar número negativo por arredondamento
        if (valorParaEstornar < 0) valorParaEstornar = 0;

        // Se sobrar algo para estornar (valor > 0), atualiza o cartão
        if (valorParaEstornar > 0) {
          batch.update(cartaoRef, {
            usado: increment(-valorParaEstornar)
          });
        }
      }
    }

    return batch.commit();
  }
}