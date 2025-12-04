import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private router = inject(Router);

    // user$ é um Observable. Ele emite o objeto User quando logado, ou null quando deslogado.
    // O cifrão ($) é uma convenção para indicar que é um Observable/Stream de dados.
    user$: Observable<User | null> = user(this.auth);

    constructor() { }

    // Função para abrir o popup do Google
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(this.auth, provider);
            console.log('Usuário logado:', result.user.displayName);
            this.router.navigate(['/dashboard']); // Redireciona após sucesso
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