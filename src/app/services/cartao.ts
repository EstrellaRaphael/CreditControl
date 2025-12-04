import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  onSnapshot // <--- Novo import
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of } from 'rxjs';
import { Cartao } from '../models/core.types';

@Injectable({
  providedIn: 'root'
})
export class CartaoService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Recupera todos os cartões (Versão Manual com onSnapshot)
  getCartoes(): Observable<Cartao[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        // Retornamos um Observable manual para ter controle total
        return new Observable<Cartao[]>(observer => {
          const cartoesCollection = collection(this.firestore, `users/${user.uid}/cartoes`);
          
          // onSnapshot é a função nativa do Firebase que ouve em tempo real
          const unsubscribe = onSnapshot(cartoesCollection, (snapshot) => {
            // Mapeamos os documentos manualmente
            const cartoes = snapshot.docs.map(doc => {
              const data = doc.data() as Cartao;
              const id = doc.id;
              return { id, ...data };
            });
            
            // Emite os dados novos para o Angular
            observer.next(cartoes);
          }, (error) => {
            observer.error(error);
          });

          // Função de limpeza (quando sair da tela)
          return () => unsubscribe();
        });
      })
    );
  }

  async addCartao(cartao: Omit<Cartao, 'id' | 'userId' | 'usado'>) {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const novoCartao: any = { // Usei 'any' temporário para evitar conflito de tipagem estrita no salvamento
      ...cartao,
      userId: user.uid,
      usado: 0
    };

    const cartoesCollection = collection(this.firestore, `users/${user.uid}/cartoes`);
    return addDoc(cartoesCollection, novoCartao);
  }

  async updateCartao(cartaoId: string, dados: Partial<Cartao>) {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/cartoes/${cartaoId}`);
    return updateDoc(docRef, dados);
  }

  async deleteCartao(cartaoId: string) {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/cartoes/${cartaoId}`);
    return deleteDoc(docRef);
  }
}