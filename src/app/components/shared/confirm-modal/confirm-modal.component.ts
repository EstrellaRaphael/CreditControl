import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle, X } from 'lucide-angular';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent {
    @Input() title: string = 'Confirmar Ação';
    @Input() message: string = 'Tem certeza que deseja continuar?';
    @Input() confirmText: string = 'Confirmar';
    @Input() cancelText: string = 'Cancelar';
    @Input() isOpen: boolean = false;
    @Input() type: 'danger' | 'warning' | 'info' = 'warning';

    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    readonly icons = { alert: AlertTriangle, close: X };

    onConfirm() {
        this.confirm.emit();
    }

    onCancel() {
        this.cancel.emit();
    }
}
