import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { LucideAngularModule, Menu } from 'lucide-angular';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, LucideAngularModule],
  templateUrl: './main-layout.html'
})
export class MainLayoutComponent {
  isMobileMenuOpen = false;
  readonly MenuIcon = Menu;

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}