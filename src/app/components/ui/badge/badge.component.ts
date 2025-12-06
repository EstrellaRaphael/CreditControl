import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-badge',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors"
      [ngClass]="getClasses()">
      
      <!-- Icon (Optional) -->
      <lucide-icon *ngIf="icon" [img]="icon" class="w-3.5 h-3.5"></lucide-icon>
      
      <!-- Content -->
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
    @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' = 'neutral';
    @Input() icon: any;

    getClasses(): string {
        const variants = {
            success: 'bg-green-50 text-green-700 border-green-100',
            warning: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            danger: 'bg-red-50 text-red-600 border-red-100',
            info: 'bg-blue-50 text-blue-600 border-blue-100',
            neutral: 'bg-gray-100 text-gray-600 border-gray-200',
            primary: 'bg-primary-50 text-primary-700 border-primary-100'
        };

        return variants[this.variant];
    }
}
