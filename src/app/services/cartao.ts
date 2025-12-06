import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from '@angular/fire/firestore';
import { HouseholdService } from './household.service';
import { Auth } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { Cartao } from '../models/core.types';

@Injectable({
  providedIn: 'root'
})
export class CartaoService {
  private firestore = inject(Firestore);
  private householdService = inject(HouseholdService);
  private auth = inject(Auth);

  /**
   * Recupera todos os cartões do Household atual (tempo real).
   */
  getCartoes(): Observable<Cartao[]> {
    return this.householdService.householdId$.pipe(
      switchMap(householdId => {
        if (!householdId) return of([]);

        return new Observable<Cartao[]>(observer => {
          const cartoesCollection = collection(this.firestore, `households/${householdId}/cartoes`);

          const unsubscribe = onSnapshot(cartoesCollection, (snapshot) => {
            const cartoes = snapshot.docs.map(doc => {
              const data = doc.data() as Cartao;
              return { id: doc.id, ...data };
            });
            observer.next(cartoes);
          }, (error) => observer.error(error));

          return () => unsubscribe();
        });
      })
    );
  }

  /**
   * Adiciona um novo cartão ao Household atual.
   */
  async addCartao(cartao: Omit<Cartao, 'id' | 'userId' | 'usado'>) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) throw new Error('Household não encontrado');

    if (!this.householdService.hasPermission('manageCards')) {
      throw new Error('Você não tem permissão para adicionar cartões');
    }

    const user = this.auth.currentUser;
    const novoCartao: any = {
      ...cartao,
      userId: '',
      usado: 0,
      createdBy: user?.uid || '',
      createdByName: user?.displayName || user?.email || 'Desconhecido'
    };

    const cartoesCollection = collection(this.firestore, `households/${householdId}/cartoes`);
    return addDoc(cartoesCollection, novoCartao);
  }

  /**
   * Atualiza um cartão existente.
   */
  async updateCartao(cartaoId: string, dados: Partial<Cartao>) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) throw new Error('Household não encontrado');

    if (!this.householdService.hasPermission('manageCards')) {
      throw new Error('Você não tem permissão para editar cartões');
    }

    const docRef = doc(this.firestore, `households/${householdId}/cartoes/${cartaoId}`);
    return updateDoc(docRef, dados);
  }

  /**
   * Exclui um cartão.
   */
  async deleteCartao(cartaoId: string) {
    const householdId = this.householdService.getHouseholdId();
    if (!householdId) throw new Error('Household não encontrado');

    if (!this.householdService.hasPermission('manageCards')) {
      throw new Error('Você não tem permissão para excluir cartões');
    }

    const docRef = doc(this.firestore, `households/${householdId}/cartoes/${cartaoId}`);
    return deleteDoc(docRef);
  }
}

// Import helper
import { switchMap } from 'rxjs';