import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, X, ShoppingBag, CreditCard, Tag } from 'lucide-angular';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Overlay -->
    <div *ngIf="isOpen" 
         class="fixed inset-0 bg-black/20 z-40 transition-opacity"
         (click)="close()">
    </div>

    <!-- FAB Menu -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      
      <!-- Quick Actions (visible when open) -->
      <div *ngIf="isOpen" class="flex flex-col-reverse items-end gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        <!-- Nova Compra -->
        <button (click)="onAction('compra')"
          class="flex items-center gap-3 pl-4 pr-5 py-3 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all group">
          <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <lucide-icon [img]="icons.bag" class="w-5 h-5"></lucide-icon>
          </div>
          <span class="font-medium text-gray-700 group-hover:text-primary">Nova Compra</span>
        </button>

        <!-- Novo Cartão -->
        <button (click)="onAction('cartao')"
          class="flex items-center gap-3 pl-4 pr-5 py-3 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all group">
          <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white">
            <lucide-icon [img]="icons.card" class="w-5 h-5"></lucide-icon>
          </div>
          <span class="font-medium text-gray-700 group-hover:text-gray-900">Novo Cartão</span>
        </button>

        <!-- Nova Categoria -->
        <button (click)="onAction('categoria')"
          class="flex items-center gap-3 pl-4 pr-5 py-3 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all group">
          <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
            <lucide-icon [img]="icons.tag" class="w-5 h-5"></lucide-icon>
          </div>
          <span class="font-medium text-gray-700 group-hover:text-emerald-700">Nova Categoria</span>
        </button>
      </div>

      <!-- Main FAB Button -->
      <button (click)="toggle()"
        class="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300"
        [class.bg-primary]="!isOpen"
        [class.bg-gray-800]="isOpen"
        [class.rotate-45]="isOpen"
        [class.hover:bg-primary-700]="!isOpen"
        [class.hover:bg-gray-700]="isOpen"
        [attr.aria-label]="isOpen ? 'Fechar menu de ações' : 'Abrir menu de ações'">
        <lucide-icon [img]="isOpen ? icons.close : icons.plus" class="w-6 h-6 text-white transition-transform"></lucide-icon>
      </button>
    </div>
  `
})
export class FabComponent {
  @Output() action = new EventEmitter<'compra' | 'cartao' | 'categoria'>();

  isOpen = false;

  readonly icons = {
    plus: Plus,
    close: X,
    bag: ShoppingBag,
    card: CreditCard,
    tag: Tag
  };

  toggle() {
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
  }

  onAction(type: 'compra' | 'cartao' | 'categoria') {
    this.action.emit(type);
    this.close();
  }
}
