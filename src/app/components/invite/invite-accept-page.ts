import { Component, inject, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Users, Check, X, Loader } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

import { AuthService } from '../../services/auth.service';
import { HouseholdService } from '../../services/household.service';
import { HouseholdInvite } from '../../models/core.types';
import { CardComponent } from '../ui/card/card.component';
import { ButtonComponent } from '../ui/button/button.component';

@Component({
  selector: 'app-invite-accept-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CardComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <app-card class="w-full max-w-md p-8 text-center">
        
        <!-- Loading State -->
        <div *ngIf="isLoading" class="py-8">
          <lucide-icon [img]="icons.loader" class="w-12 h-12 text-primary mx-auto animate-spin"></lucide-icon>
          <p class="mt-4 text-gray-500">Carregando convite...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="!isLoading && error" class="py-8">
          <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <lucide-icon [img]="icons.x" class="w-8 h-8 text-red-500"></lucide-icon>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Convite Inválido</h2>
          <p class="text-gray-500 mb-6">{{ error }}</p>
          <app-button (action)="goToLogin()">Ir para Login</app-button>
        </div>

        <!-- Success State (Invite Valid) -->
        <div *ngIf="!isLoading && !error && invite" class="py-4">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <lucide-icon [img]="icons.users" class="w-8 h-8 text-primary"></lucide-icon>
          </div>
          
          <h2 class="text-xl font-bold text-gray-900 mb-2">Convite Recebido!</h2>
          <p class="text-gray-500 mb-6">
            <strong>{{ invite.invitedByName }}</strong> convidou você para entrar no grupo 
            <strong>"{{ invite.householdName }}"</strong>.
          </p>

          <!-- Not Logged In -->
          <div *ngIf="!isLoggedIn" class="space-y-4">
            <p class="text-sm text-gray-400">Faça login para aceitar o convite:</p>
            <app-button (action)="goToLogin()" class="w-full">Fazer Login</app-button>
          </div>

          <!-- Logged In - Accept -->
          <div *ngIf="isLoggedIn" class="space-y-4">
            <app-button (action)="acceptInvite()" [loading]="isAccepting" [icon]="icons.check" class="w-full">
              Aceitar Convite
            </app-button>
            <app-button variant="secondary" (action)="goToDashboard()" class="w-full">
              Cancelar
            </app-button>
          </div>
        </div>

      </app-card>
    </div>
  `
})
export class InviteAcceptPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private householdService = inject(HouseholdService);
  private toastr = inject(ToastrService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = { users: Users, check: Check, x: X, loader: Loader };

  isLoading = true;
  isAccepting = false;
  error = '';
  invite: HouseholdInvite | null = null;
  isLoggedIn = false;
  private token = '';

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.loadInvite();

    this.authService.user$.subscribe(user => {
      this.ngZone.run(() => {
        this.isLoggedIn = !!user;
        this.cdr.detectChanges();
      });
    });
  }

  async loadInvite() {
    if (!this.token) {
      this.ngZone.run(() => {
        this.error = 'Token de convite não encontrado.';
        this.isLoading = false;
        this.cdr.detectChanges();
      });
      return;
    }

    try {
      const inviteRef = doc(this.firestore, `invites/${this.token}`);
      const inviteSnap = await getDoc(inviteRef);

      this.ngZone.run(() => {
        if (!inviteSnap.exists()) {
          this.error = 'Convite não encontrado.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        const invite = inviteSnap.data() as HouseholdInvite;

        if (invite.status !== 'pending') {
          this.error = 'Este convite já foi utilizado.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        if (new Date(invite.expiresAt) < new Date()) {
          this.error = 'Este convite expirou.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.invite = invite;
        this.isLoading = false;
        this.cdr.detectChanges();
      });

    } catch (error) {
      this.ngZone.run(() => {
        this.error = 'Erro ao carregar convite.';
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async acceptInvite() {
    this.isAccepting = true;
    this.cdr.detectChanges();

    try {
      await this.householdService.acceptInvite(this.token);
      this.ngZone.run(() => {
        this.toastr.success('Você entrou no grupo!', 'Bem-vindo!');
        this.router.navigate(['/dashboard']);
      });
    } catch (error: any) {
      this.ngZone.run(() => {
        this.toastr.error(error.message || 'Erro ao aceitar convite', 'Erro');
        this.isAccepting = false;
        this.cdr.detectChanges();
      });
    }
  }

  goToLogin() {
    sessionStorage.setItem('pendingInvite', this.token);
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
