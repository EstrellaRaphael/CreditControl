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
  where, getDocs // <--- Adicione getDocs e where // <--- ADICIONE ISSO
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of, firstValueFrom } from 'rxjs';
import { Compra, Cartao, Parcela } from '../models/core.types';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Lista compras em tempo real (ordenadas por data)
  getCompras(): Observable<Compra[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);

        return new Observable<Compra[]>(observer => {
          const comprasRef = collection(this.firestore, `users/${user.uid}/compras`);
          // Ordena por data da compra (mais recentes primeiro)
          const q = query(comprasRef, orderBy('dataCompra', 'desc'));

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
    const parcelas = this.calcularParcelas(novaCompra, cartao, user.uid, compraId);

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

  // --- MÉTODOS AUXILIARES DE CÁLCULO (RN002 e RN003) ---

  private calcularParcelas(compra: Compra, cartao: Cartao, userId: string, compraId: string): Parcela[] {
    const parcelas: Parcela[] = [];
    const dataCompra = new Date(compra.dataCompra + 'T12:00:00'); // Fuso horário safe
    const diaCompra = dataCompra.getDate();

    // RN002: Lógica do Melhor Dia (Fechamento)
    let mesReferencia = dataCompra.getMonth() + 1; // JS é 0-11
    let anoReferencia = dataCompra.getFullYear();

    // Se comprou DEPOIS ou NO DIA do fechamento, joga para o próximo mês
    if (diaCompra >= cartao.diaFechamento) {
      mesReferencia++;
      if (mesReferencia > 12) {
        mesReferencia = 1;
        anoReferencia++;
      }
    }

    // Determina quantidade de loops
    const qtd = compra.tipo === 'recorrente' ? 12 : (compra.qtdParcelas || 1);
    // Nota: Recorrente criamos 12 meses para frente como MVP.

    // RN003: Cálculo dos valores (Centavos na 1ª parcela)
    const valorTotal = compra.valorTotal;
    const qtdReal = compra.tipo === 'recorrente' ? 1 : (compra.qtdParcelas || 1); // Divisor matemático

    // Se for recorrente, o valor é fixo todo mês. Se for parcelado, divide.
    let valorParcelaBase = 0;
    let primeiraParcela = 0;

    if (compra.tipo === 'recorrente') {
      valorParcelaBase = valorTotal;
      primeiraParcela = valorTotal;
    } else {
      valorParcelaBase = Math.floor((valorTotal / qtdReal) * 100) / 100; // Arredonda para baixo 2 casas
      const diferenca = valorTotal - (valorParcelaBase * qtdReal);
      primeiraParcela = valorParcelaBase + diferenca; // Ajuste de centavos
    }

    for (let i = 1; i <= qtd; i++) {
      // Cria a data de vencimento (dia do vencimento do cartão naquele mês)
      // Nota: JS Date month index é 0-based
      const dataVenc = new Date(anoReferencia, mesReferencia - 1, cartao.diaVencimento);

      parcelas.push({
        userId,
        compraId,
        cartaoId: cartao.id!,
        numeroParcela: i,
        valor: (i === 1 && compra.tipo !== 'recorrente') ? primeiraParcela : valorParcelaBase,
        mesReferencia,
        anoReferencia,
        status: 'PENDENTE',
        dataVencimento: dataVenc.toISOString().split('T')[0]
      });

      // Avança para o próximo mês
      mesReferencia++;
      if (mesReferencia > 12) {
        mesReferencia = 1;
        anoReferencia++;
      }
    }

    return parcelas;
  }
}