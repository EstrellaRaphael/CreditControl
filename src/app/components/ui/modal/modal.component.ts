import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" [attr.aria-labelledby]="title ? 'modal-title' : null">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
             (click)="onBackdropClick()"
             aria-hidden="true">
        </div>

        <!-- Modal Panel -->
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div [class]="'relative transform rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 w-full ' + maxWidth">
                
                <!-- Helper for closing (absolute top-right) -->
                <div class="absolute right-4 top-4 z-10">
                    <button type="button" 
                            (click)="onCloseClick()"
                            class="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <span class="sr-only">Fechar</span>
                        <lucide-icon [name]="icons.x" [size]="20"></lucide-icon>
                    </button>
                </div>

                <!-- Header (Optional) -->
                <div *ngIf="title" class="px-6 pt-6 pb-2">
                    <h3 class="text-xl font-bold text-gray-900" id="modal-title">
                        {{ title }}
                    </h3>
                </div>

                <!-- Content -->
                <div class="px-6 pb-6 pt-2">
                    <ng-content></ng-content>
                </div>
            </div>
        </div>
    </div>
  `
})
export class ModalComponent {
    @Input() isOpen = false;
    @Input() title = '';
    @Input() maxWidth = 'sm:max-w-lg'; // Default width

    @Output() close = new EventEmitter<void>();

    protected readonly icons = { x: X };

    onBackdropClick() {
        console.log('ModalComponent: Backdrop clicked');
        this.close.emit();
    }

    onCloseClick() {
        console.log('ModalComponent: Close button clicked');
        this.close.emit();
    }
}
