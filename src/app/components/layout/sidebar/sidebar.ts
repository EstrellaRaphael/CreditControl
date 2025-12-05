import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LucideAngularModule, LayoutDashboard, CreditCard, ShoppingBag, LogOut, X, Tag, Info, HelpCircle } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  private authService = inject(AuthService);

  // Pegamos o usuário logado (assíncrono)
  user$ = this.authService.user$;

  // Controle para fechar o menu no mobile
  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();

  // Ícones
  readonly icons = {
    dashboard: LayoutDashboard,
    cards: CreditCard,
    shopping: ShoppingBag,
    logout: LogOut,
    close: X,
    tags: Tag,
    info: Info,
    help: HelpCircle
  };

  // Itens do menu
  menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: this.icons.dashboard },
    { label: 'Cartões', path: '/cartoes', icon: this.icons.cards },
    { label: 'Compras', path: '/compras', icon: this.icons.shopping },
    { label: 'Categorias', path: '/categorias', icon: this.icons.tags },
    { label: 'Sobre', path: '/about', icon: this.icons.info },
    { label: 'Ajuda', path: '/help', icon: this.icons.help },
  ];

  logout() {
    this.authService.logout();
  }

  onClose() {
    this.closeMenu.emit();
  }
}