import { Injectable, inject, Injector } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private router = inject(Router);
    private firestore = inject(Firestore);
    private injector = inject(Injector);

    // user$ é um Observable. Ele emite o objeto User quando logado, ou null quando deslogado.
    user$: Observable<User | null> = user(this.auth);

    constructor() { }

    // Função para abrir o popup do Google
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(this.auth, provider);
            const user = result.user;

            // Verifica se o usuário já existe no Firestore
            const userDocRef = doc(this.firestore, `users/${user.uid}`);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                // Novo usuário: Cria doc
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    tutorialCompleted: true,
                    createdAt: new Date().toISOString()
                });
            }

            // Inicializa o HouseholdService após o login (usando Injector para evitar dependência circular)
            const { HouseholdService } = await import('./household.service');
            const householdService = this.injector.get(HouseholdService);
            await householdService.initialize();

            // Sempre redireciona para o Dashboard
            this.router.navigate(['/dashboard']);

        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    // Função de Logout
    async logout() {
        try {
            await signOut(this.auth);
            this.router.navigate(['/login']);
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    }

    getCurrentUser(): User | null {
        return this.auth.currentUser;
    }
}