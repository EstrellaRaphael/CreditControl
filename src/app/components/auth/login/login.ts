import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { LucideAngularModule, Wallet } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LucideAngularModule], // Importando ícones
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);

  private toastr = inject(ToastrService);
  // Ícone que vamos usar
  readonly WalletIcon = Wallet;

  isLoading = false;

async onGoogleLogin() {
    this.isLoading = true;
    try {
      await this.authService.loginWithGoogle();
      // Não precisa de toast de sucesso aqui, pois o redirecionamento é imediato
    } catch (error) {
      console.error(error);
      this.toastr.error('Não foi possível fazer o login.', 'Erro de Autenticação'); // <--- Error
    } finally {
      this.isLoading = false;
    }
  }
}