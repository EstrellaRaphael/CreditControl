import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { LucideAngularModule, Menu } from 'lucide-angular';
import { FabComponent } from '../../shared/fab/fab.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, LucideAngularModule, FabComponent],
  templateUrl: './main-layout.html'
})
export class MainLayoutComponent {
  private router = inject(Router);

  isMobileMenuOpen = false;
  readonly MenuIcon = Menu;

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onFabAction(action: 'compra' | 'cartao' | 'categoria') {
    switch (action) {
      case 'compra':
        this.router.navigate(['/compras'], { queryParams: { action: 'new' } });
        break;
      case 'cartao':
        this.router.navigate(['/cartoes'], { queryParams: { action: 'new' } });
        break;
      case 'categoria':
        this.router.navigate(['/categorias']);
        break;
    }
  }
}