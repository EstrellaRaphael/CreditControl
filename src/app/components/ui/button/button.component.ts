import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick($event)"
      [ngClass]="getClasses()"
      class="inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
      
      <!-- Loading Spinner -->
      <lucide-icon *ngIf="loading" [img]="icons.loader" class="w-4 h-4 animate-spin"></lucide-icon>
      
      <!-- Icon (Left) -->
      <lucide-icon *ngIf="icon && !loading" [img]="icon" class="w-4 h-4"></lucide-icon>
      
      <!-- Content -->
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
    @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' = 'primary';
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() icon: any;
    @Input() loading = false;
    @Input() disabled = false;
    @Input() block = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';

    @Output() action = new EventEmitter<Event>();

    readonly icons = { loader: Loader2 };

    onClick(event: Event) {
        if (!this.disabled && !this.loading) {
            this.action.emit(event);
        }
    }

    getClasses(): string {
        const baseClasses = this.block ? 'w-full' : '';

        const sizes = {
            sm: 'px-3 py-1.5 text-xs rounded-lg',
            md: 'px-4 py-2 text-sm rounded-xl',
            lg: 'px-6 py-3 text-base rounded-xl'
        };

        const variants = {
            primary: 'bg-primary text-white hover:bg-primary-700 shadow-lg shadow-primary/20 hover:shadow-primary/30',
            secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm',
            danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
            ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            outline: 'bg-transparent border border-primary text-primary hover:bg-primary-50'
        };

        return `${baseClasses} ${sizes[this.size]} ${variants[this.variant]}`;
    }
}
