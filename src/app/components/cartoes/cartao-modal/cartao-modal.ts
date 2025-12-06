import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LucideAngularModule, X, Check } from 'lucide-angular';
import { Cartao } from '../../../models/core.types';
import { CartaoService } from '../../../services/cartao';
import { ToastrService } from 'ngx-toastr';
import { InputComponent } from '../../ui/input/input.component';
import { SelectComponent } from '../../ui/select/select.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-cartao-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './cartao-modal.html'
})
export class CartaoModalComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private cartaoService = inject(CartaoService);
  private ngZone = inject(NgZone); // 2. Injeção do NgZone
  private toastr = inject(ToastrService); // Injete aqui

  // Controles de Entrada/Saída
  @Input() isOpen = false;
  @Input() cartaoToEdit: Cartao | null = null; // Se vier preenchido, é edição
  @Output() close = new EventEmitter<void>();

  isLoading = false;
  readonly icons = { close: X, check: Check };

  // Paleta de cores sugerida na documentação
  readonly colorPresets = [
    '#8b5cf6', // Purple (Primary)
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#6366f1'  // Indigo
  ];

  readonly bandeiraOptions = [
    { label: 'Mastercard', value: 'Mastercard' },
    { label: 'Visa', value: 'Visa' },
    { label: 'Elo', value: 'Elo' },
    { label: 'Amex', value: 'Amex' }
  ];

  readonly dateOptions = Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));

  // Configuração do Formulário
  form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    bandeira: ['Mastercard', Validators.required],
    limiteTotal: [0, [Validators.required, Validators.min(1)]],
    diaFechamento: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    diaVencimento: [10, [Validators.required, Validators.min(1), Validators.max(31)]],
    cor: ['#8b5cf6', Validators.required]
  });

  // Detecta quando o "cartaoToEdit" muda (para preencher o formulário na edição)
  ngOnChanges(changes: SimpleChanges): void {
    // Se o modal está abrindo (isOpen mudou para true)
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.isLoading = false; // <--- FORÇA O RESET DO LOADING

      if (this.cartaoToEdit) {
        // Modo Edição
        this.form.patchValue(this.cartaoToEdit);
      } else {
        // Modo Criação: Reseta para valores padrão
        this.form.reset({
          nome: '',
          bandeira: 'Mastercard',
          limiteTotal: 0,
          diaFechamento: 1,
          diaVencimento: 10,
          cor: '#8b5cf6'
        });
      }
    }
  }

  onClose() {
    this.close.emit();
  }

  selectColor(color: string) {
    this.form.patchValue({ cor: color });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formData = this.form.value;

    try {
      if (this.cartaoToEdit && this.cartaoToEdit.id) {
        await this.cartaoService.updateCartao(this.cartaoToEdit.id, formData);
        this.toastr.success('Cartão atualizado com sucesso!', 'Tudo certo'); // <--- Sucesso
      } else {
        await this.cartaoService.addCartao(formData);
        this.toastr.success('Cartão criado com sucesso!', 'Parabéns'); // <--- Sucesso
      }

      this.ngZone.run(() => {
        this.isLoading = false;
        this.onClose();
      });

    } catch (error) {
      console.error('Erro ao salvar cartão:', error);

      this.ngZone.run(() => {
        this.isLoading = false;
        // Substituindo o alert feio pelo Toast bonito
        this.toastr.error('Não foi possível salvar o cartão.', 'Ocorreu um erro');
      });
    }
  }
}