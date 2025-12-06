import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CreditCard, ShoppingBag, Calendar, Tag, Sparkles } from 'lucide-angular';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="py-16 text-center">
      <!-- Illustration -->
      <div class="relative w-32 h-32 mx-auto mb-6">
        <!-- Background circles -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full animate-pulse"></div>
        <div class="absolute inset-2 bg-gradient-to-br from-primary-50 to-white rounded-full"></div>
        
        <!-- Icon -->
        <div class="absolute inset-0 flex items-center justify-center">
          <lucide-icon [img]="getIcon()" class="w-12 h-12 text-primary"></lucide-icon>
        </div>

        <!-- Decorative sparkles -->
        <div class="absolute -top-2 -right-2 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <lucide-icon [img]="icons.sparkles" class="w-3 h-3 text-yellow-500"></lucide-icon>
        </div>
      </div>

      <!-- Text -->
      <h3 class="text-xl font-bold text-gray-900 mb-2">{{ title }}</h3>
      <p class="text-gray-500 max-w-sm mx-auto mb-6">{{ description }}</p>

      <!-- CTA Button -->
      <button *ngIf="actionLabel" (click)="onActionClick()"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 active:scale-95">
        <lucide-icon [img]="getIcon()" class="w-4 h-4"></lucide-icon>
        {{ actionLabel }}
      </button>
    </div>
  `
})
export class EmptyStateComponent {
    @Input() type: 'cartao' | 'compra' | 'parcela' | 'categoria' = 'compra';
    @Input() title = 'Nada por aqui';
    @Input() description = 'Comece adicionando um novo item.';
    @Input() actionLabel = '';
    @Input() actionCallback: () => void = () => { };

    readonly icons = {
        card: CreditCard,
        bag: ShoppingBag,
        calendar: Calendar,
        tag: Tag,
        sparkles: Sparkles
    };

    getIcon() {
        switch (this.type) {
            case 'cartao': return this.icons.card;
            case 'compra': return this.icons.bag;
            case 'parcela': return this.icons.calendar;
            case 'categoria': return this.icons.tag;
            default: return this.icons.bag;
        }
    }

    onActionClick() {
        if (this.actionCallback) {
            this.actionCallback();
        }
    }
}
