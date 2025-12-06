import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, updateDoc, doc, query, orderBy, onSnapshot } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of, firstValueFrom } from 'rxjs';
import { Categoria } from '../models/core.types';

@Injectable({
    providedIn: 'root'
})
export class CategoriaService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    // Lista categorias em tempo real
    getCategorias(): Observable<Categoria[]> {
        return this.authService.user$.pipe(
            switchMap(user => {
                if (!user) return of([]);

                return new Observable<Categoria[]>(observer => {
                    const categoriasRef = collection(this.firestore, `users/${user.uid}/categorias`);
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

    async addCategoria(categoria: Omit<Categoria, 'id' | 'userId'>) {
        const user = await firstValueFrom(this.authService.user$);
        if (!user) throw new Error('Usuário não autenticado');

        const categoriasRef = collection(this.firestore, `users/${user.uid}/categorias`);

        return addDoc(categoriasRef, {
            ...categoria,
            userId: user.uid
        });
    }

    async updateCategoria(id: string, dados: Partial<Categoria>) {
        const user = await firstValueFrom(this.authService.user$);
        if (!user) throw new Error('Usuário não autenticado');

        const categoriaRef = doc(this.firestore, `users/${user.uid}/categorias/${id}`);
        return updateDoc(categoriaRef, dados);
    }

    async deleteCategoria(id: string) {
        const user = await firstValueFrom(this.authService.user$);
        if (!user) throw new Error('Usuário não autenticado');

        const categoriaRef = doc(this.firestore, `users/${user.uid}/categorias/${id}`);
        return deleteDoc(categoriaRef);
    }
}
