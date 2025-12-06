import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" [ngClass]="class">
        <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
    @Input() class = '';
}
