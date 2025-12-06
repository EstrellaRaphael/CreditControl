import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, updateDoc, doc, query, orderBy, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { HouseholdService } from './household.service';
import { Observable, switchMap, of } from 'rxjs';
import { Categoria } from '../models/core.types';

@Injectable({
    providedIn: 'root'
})
export class CategoriaService {
    private firestore = inject(Firestore);
    private householdService = inject(HouseholdService);
    private auth = inject(Auth);

    /**
     * Lista categorias em tempo real do Household atual.
     */
    getCategorias(): Observable<Categoria[]> {
        return this.householdService.householdId$.pipe(
            switchMap(householdId => {
                if (!householdId) return of([]);

                return new Observable<Categoria[]>(observer => {
                    const categoriasRef = collection(this.firestore, `households/${householdId}/categorias`);
                    const q = query(categoriasRef, orderBy('nome', 'asc'));

                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const categorias = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as Categoria));
                        observer.next(categorias);
                    });
                    return () => unsubscribe();
                });
            })
        );
    }

    /**
     * Adiciona uma nova categoria ao Household atual.
     */
    async addCategoria(categoria: Omit<Categoria, 'id' | 'userId'>) {
        const householdId = this.householdService.getHouseholdId();
        if (!householdId) throw new Error('Household não encontrado');

        if (!this.householdService.hasPermission('manageCategories')) {
            throw new Error('Você não tem permissão para adicionar categorias');
        }

        const user = this.auth.currentUser;
        const categoriasRef = collection(this.firestore, `households/${householdId}/categorias`);
        return addDoc(categoriasRef, {
            ...categoria,
            userId: '',
            createdBy: user?.uid || '',
            createdByName: user?.displayName || user?.email || 'Desconhecido'
        });
    }

    /**
     * Atualiza uma categoria existente.
     */
    async updateCategoria(id: string, dados: Partial<Categoria>) {
        const householdId = this.householdService.getHouseholdId();
        if (!householdId) throw new Error('Household não encontrado');

        if (!this.householdService.hasPermission('manageCategories')) {
            throw new Error('Você não tem permissão para editar categorias');
        }

        const categoriaRef = doc(this.firestore, `households/${householdId}/categorias/${id}`);
        return updateDoc(categoriaRef, dados);
    }

    /**
     * Exclui uma categoria.
     */
    async deleteCategoria(id: string) {
        const householdId = this.householdService.getHouseholdId();
        if (!householdId) throw new Error('Household não encontrado');

        if (!this.householdService.hasPermission('manageCategories')) {
            throw new Error('Você não tem permissão para excluir categorias');
        }

        const categoriaRef = doc(this.firestore, `households/${householdId}/categorias/${id}`);
        return deleteDoc(categoriaRef);
    }
}
