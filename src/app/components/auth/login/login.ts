import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { LucideAngularModule, Wallet, LayoutDashboard, CreditCard, ShoppingBag, Tag, CheckCircle, Sparkles } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  readonly icons = {
    wallet: Wallet,
    dashboard: LayoutDashboard,
    card: CreditCard,
    shopping: ShoppingBag,
    tag: Tag,
    check: CheckCircle,
    sparkles: Sparkles
  };

  steps = [
    {
      title: 'Cadastre seus Cartões',
      description: 'Controle limites e vencimentos.',
      icon: this.icons.card,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Organize com Categorias',
      description: 'Saiba exatamente para onde vai seu dinheiro.',
      icon: this.icons.tag,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Registre suas Compras',
      description: 'À vista, parceladas ou recorrentes.',
      icon: this.icons.shopping,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'Acompanhe no Dashboard',
      description: 'Resumos e gráficos em tempo real.',
      icon: this.icons.dashboard,
      color: 'bg-blue-100 text-blue-600'
    }
  ];

  isLoading = false;

  async onGoogleLogin() {
    this.isLoading = true;
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error(error);
      this.toastr.error('Não foi possível fazer o login.', 'Erro de Autenticação');
    } finally {
      this.isLoading = false;
    }
  }
}