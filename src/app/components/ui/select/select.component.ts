import { Component, Input, Optional, Self, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';

export interface SelectOption {
    label: string;
    value: any;
}

@Component({
    selector: 'app-select',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    template: `
    <div class="space-y-1.5">
      <label *ngIf="label" class="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        {{ label }}
      </label>
      
      <div class="relative">
        <select
          [disabled]="isDisabled"
          [value]="value"
          (change)="onChangeInternal($event)"
          (blur)="onBlur()"
          [ngClass]="{
            'border-red-300 focus:border-red-500 focus:ring-red-100': invalid,
            'border-gray-200 focus:border-primary focus:ring-primary/10': !invalid,
            'text-gray-400': !value
          }"
          class="w-full px-4 py-2.5 rounded-xl border bg-white outline-none transition-all focus:ring-4 text-sm text-gray-900 shadow-sm appearance-none disabled:opacity-60 disabled:bg-gray-50 pr-10 cursor-pointer"
        >
          <option value="" disabled selected>{{ placeholder }}</option>
          <option *ngFor="let opt of options" [value]="opt.value" class="text-gray-900">
            {{ opt.label }}
          </option>
        </select>

        <!-- Chevron Icon -->
        <div class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
             <lucide-icon [img]="chevronIcon" class="w-4 h-4"></lucide-icon>
        </div>
      </div>

      <!-- Error Message -->
      <p *ngIf="invalid && error" class="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
        {{ error }}
      </p>
    </div>
  `
})
export class SelectComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = 'Selecione...';
    @Input() options: SelectOption[] = [];

    value: any = '';
    isDisabled = false;
    readonly chevronIcon = ChevronDown;

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
        return 'Valor inválido';
    }

    onChangeInternal(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
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
}
