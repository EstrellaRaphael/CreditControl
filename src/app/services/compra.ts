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
import { Auth } from '@angular/fire/auth';
import { HouseholdService } from './household.service';
import { Observable, switchMap, of } from 'rxjs';
import { Compra, Cartao, Parcela } from '../models/core.types';
import { InstallmentCalculator } from '../utils/installment-calculator';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private firestore = inject(Firestore);
  private householdService = inject(HouseholdService);
  private auth = inject(Auth);

  /**
   * Lista compras em tempo real do Household atual.
   */
  getCompras(start?: string, end?: string): Observable<Compra[]> {
    return this.householdService.householdId$.pipe(
      switchMap(householdId => {
        if (!householdId) return of([]);

        return new Observable<Compra[]>(observer => {
          const comprasRef = collection(this.firestore, `households/${householdId}/compras`);

          let constraints: any[] = [orderBy('dataCompra', 'desc')];
          if (start) constraints.push(where('dataCompra', '>=', start));
          if (end) constraints.push(where('dataCompra', '<=', end));
          if (!start && !end) constraints.push(limit(100));

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

  /**
   * Salva Compra + Gera Parcelas + Atualiza Cartão (Batch)
   */
  async addCompra(compra: Omit<Compra, 'id' | 'userId'>, cartao: Cartao) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) throw new Error('Household não encontrado');

    if (!this.householdService.hasPermission('managePurchases')) {
      throw new Error('Você não tem permissão para adicionar compras');
    }

    const batch = writeBatch(this.firestore);

    // Prepara a Compra
    const compraId = doc(collection(this.firestore, 'dummy')).id;
    const compraRef = doc(this.firestore, `households/${householdId}/compras/${compraId}`);

    const user = this.auth.currentUser;
    const novaCompra: Compra = {
      ...compra,
      id: compraId,
      userId: '',
      cartaoNome: cartao.nome,
      cartaoCor: cartao.cor,
      parcelasPagas: 0,
      createdBy: user?.uid || '',
      createdByName: user?.displayName || user?.email || 'Desconhecido'
    };

    batch.set(compraRef, novaCompra);

    // Gera Parcelas
    const parcelas = InstallmentCalculator.calculate(novaCompra, cartao, '', compraId);
    parcelas.forEach(parcela => {
      const parcelaRef = doc(collection(this.firestore, `households/${householdId}/parcelas`));
      batch.set(parcelaRef, parcela);
    });

    // Atualiza saldo do Cartão
    const cartaoRef = doc(this.firestore, `households/${householdId}/cartoes/${cartao.id}`);
    batch.update(cartaoRef, {
      usado: (cartao.usado || 0) + compra.valorTotal
    });

    return batch.commit();
  }

  /**
   * Atualiza Compra (Safe Edit vs Full Reset)
   */
  async updateCompra(compraId: string, novosDados: Partial<Compra>, cartao: Cartao) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) throw new Error('Household não encontrado');

    if (!this.householdService.hasPermission('managePurchases')) {
      throw new Error('Você não tem permissão para editar compras');
    }

    const batch = writeBatch(this.firestore);

    // Buscar compra antiga
    const compraRef = doc(this.firestore, `households/${householdId}/compras/${compraId}`);
    const compraSnap = await getDoc(compraRef);
    if (!compraSnap.exists()) throw new Error('Compra não encontrada');
    const compraAntiga = compraSnap.data() as Compra;

    // Detectar mudança financeira
    const mudouValor = novosDados.valorTotal !== undefined && Math.abs(novosDados.valorTotal - compraAntiga.valorTotal) > 0.01;
    const mudouQtdParcelas = novosDados.qtdParcelas !== undefined && novosDados.qtdParcelas !== compraAntiga.qtdParcelas;
    const mudouData = novosDados.dataCompra !== undefined && novosDados.dataCompra !== compraAntiga.dataCompra;
    const mudouCartao = novosDados.cartaoId !== undefined && novosDados.cartaoId !== compraAntiga.cartaoId;
    const mudouTipo = novosDados.tipo !== undefined && novosDados.tipo !== compraAntiga.tipo;

    const isFinanceiro = mudouValor || mudouQtdParcelas || mudouData || mudouCartao || mudouTipo;

    if (!isFinanceiro) {
      // === CAMINHO SEGURO ===
      batch.update(compraRef, {
        ...novosDados,
        cartaoNome: cartao.nome,
        cartaoCor: cartao.cor
      });

      // Atualiza nome nas parcelas
      const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);
      const q = query(parcelasRef, where('compraId', '==', compraId));
      const parcelasSnap = await getDocs(q);

      parcelasSnap.forEach(docSnap => {
        batch.update(docSnap.ref, {
          compraDescricao: novosDados.descricao || compraAntiga.descricao,
          cartaoNome: cartao.nome
        });
      });

      return batch.commit();

    } else {
      // === CAMINHO DESTRUTIVO ===

      // Estorna limite do cartão antigo
      if (compraAntiga.cartaoId) {
        const cartaoAntigoRef = doc(this.firestore, `households/${householdId}/cartoes/${compraAntiga.cartaoId}`);
        batch.update(cartaoAntigoRef, { usado: increment(-compraAntiga.valorTotal) });
      }

      // Deleta parcelas antigas
      const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);
      const q = query(parcelasRef, where('compraId', '==', compraId));
      const parcelasSnapshot = await getDocs(q);
      parcelasSnapshot.forEach(docSnapshot => batch.delete(docSnapshot.ref));

      // Atualiza Compra
      const compraAtualizada: Compra = {
        ...compraAntiga,
        ...novosDados,
        cartaoNome: cartao.nome,
        cartaoCor: cartao.cor,
        parcelasPagas: 0
      };
      batch.set(compraRef, compraAtualizada);

      // Gera novas parcelas
      const novasParcelas = InstallmentCalculator.calculate(compraAtualizada, cartao, '', compraId);
      novasParcelas.forEach(parcela => {
        const novaParcelaRef = doc(collection(this.firestore, `households/${householdId}/parcelas`));
        batch.set(novaParcelaRef, parcela);
      });

      // Atualiza limite do novo cartão
      const novoCartaoRef = doc(this.firestore, `households/${householdId}/cartoes/${cartao.id}`);
      batch.update(novoCartaoRef, { usado: increment(compraAtualizada.valorTotal) });

      return batch.commit();
    }
  }

  /**
   * Exclui Compra + Parcelas + Estorna Limite
   */
  async deleteCompra(compra: Compra) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId || !compra.id) return;

    if (!this.householdService.hasPermission('managePurchases')) {
      throw new Error('Você não tem permissão para excluir compras');
    }

    const batch = writeBatch(this.firestore);

    // Deleta compra
    const compraRef = doc(this.firestore, `households/${householdId}/compras/${compra.id}`);
    batch.delete(compraRef);

    // Deleta parcelas
    const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);
    const q = query(parcelasRef, where('compraId', '==', compra.id));
    const parcelasSnapshot = await getDocs(q);
    parcelasSnapshot.forEach(docSnapshot => batch.delete(docSnapshot.ref));

    // Estorna cartão
    if (compra.cartaoId) {
      const cartaoRef = doc(this.firestore, `households/${householdId}/cartoes/${compra.cartaoId}`);
      const cartaoSnap = await getDoc(cartaoRef);

      if (cartaoSnap.exists()) {
        let valorParaEstornar = compra.valorTotal;

        if (compra.parcelasPagas && compra.parcelasPagas > 0) {
          const totalParcelas = compra.tipo === 'recorrente' ? 12 : (compra.qtdParcelas || 1);
          const valorJaPago = (compra.valorTotal / totalParcelas) * compra.parcelasPagas;
          valorParaEstornar = compra.valorTotal - valorJaPago;
        }

        if (valorParaEstornar > 0) {
          batch.update(cartaoRef, { usado: increment(-valorParaEstornar) });
        }
      }
    }

    return batch.commit();
  }

  /**
   * Verifica se categoria está em uso
   */
  async checkCategoriaInUse(categoriaNome: string): Promise<boolean> {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) return false;

    const comprasRef = collection(this.firestore, `households/${householdId}/compras`);
    const q = query(comprasRef, where('categoria', '==', categoriaNome), limit(1));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  }

  /**
   * Cancela assinatura recorrente
   */
  async cancelarAssinatura(compraId: string): Promise<void> {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) throw new Error('Household não encontrado');

    if (!this.householdService.hasPermission('managePurchases')) {
      throw new Error('Você não tem permissão para cancelar assinaturas');
    }

    const batch = writeBatch(this.firestore);
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // Atualiza compra
    const compraRef = doc(this.firestore, `households/${householdId}/compras/${compraId}`);
    batch.update(compraRef, {
      status: 'cancelada',
      dataCancelamento: hoje.toISOString()
    });

    // Remove parcelas futuras
    const parcelasRef = collection(this.firestore, `households/${householdId}/parcelas`);
    const q = query(parcelasRef, where('compraId', '==', compraId));
    const parcelasSnapshot = await getDocs(q);

    let parcelasRemovidas = 0;
    parcelasSnapshot.forEach(docSnapshot => {
      const parcela = docSnapshot.data() as any;
      const isFutura = parcela.anoReferencia > anoAtual ||
        (parcela.anoReferencia === anoAtual && parcela.mesReferencia > mesAtual);

      if (isFutura && parcela.status === 'PENDENTE') {
        batch.delete(docSnapshot.ref);
        parcelasRemovidas++;
      }
    });

    // Estorna valores
    if (parcelasRemovidas > 0) {
      const compraSnap = await getDoc(compraRef);
      if (compraSnap.exists()) {
        const compra = compraSnap.data() as Compra;
        const valorEstorno = compra.valorTotal * parcelasRemovidas;
        const cartaoRef = doc(this.firestore, `households/${householdId}/cartoes/${compra.cartaoId}`);
        batch.update(cartaoRef, { usado: increment(-valorEstorno) });
      }
    }

    return batch.commit();
  }
}