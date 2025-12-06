import { Component, Input, Optional, Self, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import * as LucideIcons from 'lucide-angular';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    template: `
    <div class="space-y-1.5">
      <label *ngIf="label" class="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        {{ label }}
      </label>
      
      <div class="relative">
        <!-- Input -->
        <input
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="isDisabled"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
          [ngClass]="{
            'pl-10': icon,
            'border-red-300 focus:border-red-500 focus:ring-red-100': invalid,
            'border-gray-200 focus:border-primary focus:ring-primary/10': !invalid
          }"
          class="w-full px-4 py-2.5 rounded-xl border bg-white outline-none transition-all placeholder:text-gray-400 focus:ring-4 text-sm text-gray-900 shadow-sm disabled:opacity-60 disabled:bg-gray-50"
        />

        <!-- Icon -->
        <div *ngIf="icon" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
            <lucide-icon [img]="getIcon(icon)" class="w-4 h-4"></lucide-icon>
        </div>
      </div>

      <!-- Hint -->
      <p *ngIf="hint && !invalid" class="text-xs text-gray-500">{{ hint }}</p>

      <!-- Error Message -->
      <p *ngIf="invalid && error" class="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
        {{ error }}
      </p>
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() type: 'text' | 'number' | 'date' | 'email' | 'password' = 'text';
    @Input() placeholder = '';
    @Input() icon = '';
    @Input() hint = '';

    value: any = '';
    isDisabled = false;

    onChange = (_: any) => { };
    onTouched = () => { };

    constructor(
        @Optional() @Self() public ngControl: NgControl,
        private cdr: ChangeDetectorRef
    ) {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    get invalid(): boolean {
        return !!(this.ngControl?.invalid && this.ngControl?.touched);
    }

    get error(): string {
        if (!this.ngControl?.errors) return '';
        if (this.ngControl.errors['required']) return 'Campo obrigatório';
        if (this.ngControl.errors['email']) return 'Email inválido';
        if (this.ngControl.errors['minlength']) return `Mínimo de ${this.ngControl.errors['minlength'].requiredLength} caracteres`;
        return 'Valor inválido';
    }

    onInput(event: Event) {
        const rawValue = (event.target as HTMLInputElement).value;
        // Parse as number if type is 'number' to avoid string concatenation issues
        const value = this.type === 'number' ? (rawValue === '' ? 0 : parseFloat(rawValue)) : rawValue;
        this.value = value;
        this.onChange(value);
    }

    onBlur() {
        this.onTouched();
    }

    writeValue(value: any): void {
        this.value = value || '';
        this.cdr.markForCheck();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
        this.cdr.markForCheck();
    }

    getIcon(name: string): any {
        // @ts-ignore
        return LucideIcons[name] || LucideIcons.HelpCircle;
    }
}
