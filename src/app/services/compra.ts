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

  // NOVO: Atualiza Compra com verificação inteligente (Safe Edit vs Full Reset)
  async updateCompra(compraId: string, novosDados: Partial<Compra>, cartao: Cartao) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) throw new Error('Usuário não autenticado');

    const batch = writeBatch(this.firestore);

    // 1. Buscar a compra antiga
    const compraRef = doc(this.firestore, `users/${user.uid}/compras/${compraId}`);
    const compraSnap = await getDoc(compraRef);
    if (!compraSnap.exists()) throw new Error('Compra não encontrada');
    const compraAntiga = compraSnap.data() as Compra;

    // 2. Detectar se houve mudança financeira crítica
    const mudouValor = novosDados.valorTotal !== undefined && Math.abs(novosDados.valorTotal - compraAntiga.valorTotal) > 0.01;
    const mudouQtdParcelas = novosDados.qtdParcelas !== undefined && novosDados.qtdParcelas !== compraAntiga.qtdParcelas;
    const mudouData = novosDados.dataCompra !== undefined && novosDados.dataCompra !== compraAntiga.dataCompra;
    const mudouCartao = novosDados.cartaoId !== undefined && novosDados.cartaoId !== compraAntiga.cartaoId;
    const mudouTipo = novosDados.tipo !== undefined && novosDados.tipo !== compraAntiga.tipo;

    const isFinanceiro = mudouValor || mudouQtdParcelas || mudouData || mudouCartao || mudouTipo;

    if (!isFinanceiro) {
      // === CAMINHO SEGURO (Apenas dados cadastrais) ===
      // Atualiza apenas a Compra (Pai) e as Parcelas (Filhas) com o novo nome/cartão Visual
      // NÃO mexe em valores, status de pagamento ou limites.

      // Atualiza Compra
      batch.update(compraRef, {
        ...novosDados,
        cartaoNome: cartao.nome, // Atualiza visual
        cartaoCor: cartao.cor
      });

      // Atualiza nome da compra/cartão nas parcelas existentes (para manter consistência visual)
      const parcelasRef = collection(this.firestore, `users/${user.uid}/parcelas`);
      const q = query(parcelasRef, where('compraId', '==', compraId));
      const parcelasSnap = await getDocs(q);

      parcelasSnap.forEach(docSnap => {
        batch.update(docSnap.ref, {
          compraDescricao: novosDados.descricao || compraAntiga.descricao,
          cartaoNome: cartao.nome
          // Não muda status, valor, data...
        });
      });

      return batch.commit();

    } else {
      // === CAMINHO DESTRUTIVO (Reset Financeiro) ===
      // Logica antiga: Estorna tudo e recria.

      // A. Estornar limite do cartão antigo
      if (compraAntiga.cartaoId) {
        const cartaoAntigoRef = doc(this.firestore, `users/${user.uid}/cartoes/${compraAntiga.cartaoId}`);
        // RESET TOTAL: Reverte o valor total original
        batch.update(cartaoAntigoRef, {
          usado: increment(-compraAntiga.valorTotal)
        });
      }

      // B. Deletar parcelas antigas
      const parcelasRef = collection(this.firestore, `users/${user.uid}/parcelas`);
      const q = query(parcelasRef, where('compraId', '==', compraId));
      const parcelasSnapshot = await getDocs(q);
      parcelasSnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      // C. Atualizar Compra (Com Reset de Pagamento)
      const compraAtualizada: Compra = {
        ...compraAntiga,
        ...novosDados,
        cartaoNome: cartao.nome,
        cartaoCor: cartao.cor,
        parcelasPagas: 0 // <--- O Reset acontece aqui
      };
      batch.set(compraRef, compraAtualizada);

      // D. Gerar novas parcelas
      const novasParcelas = InstallmentCalculator.calculate(compraAtualizada, cartao, user.uid, compraId);
      novasParcelas.forEach(parcela => {
        const novaParcelaRef = doc(collection(this.firestore, `users/${user.uid}/parcelas`));
        batch.set(novaParcelaRef, parcela);
      });

      // E. Atualizar limite do (novo) cartão
      const novoCartaoRef = doc(this.firestore, `users/${user.uid}/cartoes/${cartao.id}`);
      batch.update(novoCartaoRef, {
        usado: increment(compraAtualizada.valorTotal)
      });

      return batch.commit();
    }
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

  // Verifica se uma categoria está em uso por alguma compra
  async checkCategoriaInUse(categoriaNome: string): Promise<boolean> {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) return false;

    const comprasRef = collection(this.firestore, `users/${user.uid}/compras`);
    const q = query(comprasRef, where('categoria', '==', categoriaNome), limit(1));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  }

  // Cancela uma assinatura recorrente e remove parcelas futuras
  async cancelarAssinatura(compraId: string): Promise<void> {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) throw new Error('Usuário não autenticado');

    const batch = writeBatch(this.firestore);
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // 1. Atualiza a compra com status cancelada
    const compraRef = doc(this.firestore, `users/${user.uid}/compras/${compraId}`);
    batch.update(compraRef, {
      status: 'cancelada',
      dataCancelamento: hoje.toISOString()
    });

    // 2. Remove parcelas futuras (após o mês atual)
    const parcelasRef = collection(this.firestore, `users/${user.uid}/parcelas`);
    const q = query(parcelasRef, where('compraId', '==', compraId));
    const parcelasSnapshot = await getDocs(q);

    let parcelasRemovidas = 0;
    parcelasSnapshot.forEach((docSnapshot) => {
      const parcela = docSnapshot.data() as any;
      // Remove se for futuro (após o mês atual)
      const isFutura = parcela.anoReferencia > anoAtual ||
        (parcela.anoReferencia === anoAtual && parcela.mesReferencia > mesAtual);

      if (isFutura && parcela.status === 'PENDENTE') {
        batch.delete(docSnapshot.ref);
        parcelasRemovidas++;
      }
    });

    // 3. Estorna valor das parcelas removidas do cartão
    if (parcelasRemovidas > 0) {
      const compraSnap = await getDoc(compraRef);
      if (compraSnap.exists()) {
        const compra = compraSnap.data() as Compra;
        const valorParcela = compra.valorTotal;
        const valorEstorno = valorParcela * parcelasRemovidas;

        const cartaoRef = doc(this.firestore, `users/${user.uid}/cartoes/${compra.cartaoId}`);
        batch.update(cartaoRef, {
          usado: increment(-valorEstorno)
        });
      }
    }

    return batch.commit();
  }
}