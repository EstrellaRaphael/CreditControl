import { Component, EventEmitter, Input, Output, OnInit, inject, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LucideAngularModule, X, Check, AlertTriangle } from 'lucide-angular';
import { Cartao, Compra } from '../../../models/core.types';
import { Observable } from 'rxjs';
import { CompraService } from '../../../services/compra';
import { CartaoService } from '../../../services/cartao';
import { ToastrService } from 'ngx-toastr'; // <--- Importe no topo

@Component({
  selector: 'app-compra-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './compra-modal.html'
})
export class CompraModalComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private compraService = inject(CompraService);
  private cartaoService = inject(CartaoService);
  private ngZone = inject(NgZone);
  private toastr = inject(ToastrService); // <--- Injete aqui

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  isLoading = false;
  readonly icons = { close: X, check: Check, alert: AlertTriangle };
  
  // Lista de cartões para o Select
  cartoes$: Observable<Cartao[]> = this.cartaoService.getCartoes();
  cartoesList: Cartao[] = []; // Para busca local ao salvar

  // Categorias fixas
  readonly categorias = [
    'Alimentação', 'Mercado', 'Lazer', 'Transporte', 
    'Assinatura', 'Saúde', 'Educação', 'Casa', 'Outros'
  ];

  form: FormGroup = this.fb.group({
    descricao: ['', [Validators.required, Validators.minLength(3)]],
    valorTotal: ['', [Validators.required, Validators.min(0.01)]], // Usamos string vazia inicialmente
    dataCompra: [new Date().toISOString().split('T')[0], Validators.required],
    cartaoId: ['', Validators.required],
    categoria: ['', Validators.required],
    tipo: ['avista', Validators.required],
    qtdParcelas: [1]
  });

  ngOnInit() {
    // Carrega a lista de cartões para memória (para pegar o objeto Cartao completo depois)
    this.cartoes$.subscribe(c => this.cartoesList = c);

    // Monitora mudança no Tipo de Pagamento para validar Parcelas
    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      const parcelasCtrl = this.form.get('qtdParcelas');
      
      if (tipo === 'parcelado') {
        parcelasCtrl?.setValidators([Validators.required, Validators.min(2), Validators.max(24)]);
        parcelasCtrl?.setValue(2); // Default para 2x
      } else {
        parcelasCtrl?.clearValidators();
        parcelasCtrl?.setValue(1);
      }
      parcelasCtrl?.updateValueAndValidity();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.isLoading = false;
      this.form.reset({
        descricao: '',
        valorTotal: '',
        dataCompra: new Date().toISOString().split('T')[0], // Hoje
        cartaoId: '',
        categoria: '',
        tipo: 'avista',
        qtdParcelas: 1
      });
    }
  }

  onClose() {
    this.close.emit();
  }

async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formData = this.form.value;

    const cartaoSelecionado = this.cartoesList.find(c => c.id === formData.cartaoId);

    if (!cartaoSelecionado) {
      this.toastr.warning('O cartão selecionado não foi encontrado.', 'Atenção'); // <--- Warning
      this.isLoading = false;
      return;
    }

    try {
      await this.compraService.addCompra({
        descricao: formData.descricao,
        valorTotal: Number(formData.valorTotal),
        dataCompra: formData.dataCompra,
        cartaoId: formData.cartaoId,
        categoria: formData.categoria,
        tipo: formData.tipo,
        qtdParcelas: Number(formData.qtdParcelas)
      }, cartaoSelecionado);

      // Sucesso!
      this.toastr.success('Compra lançada com sucesso!', 'Feito!'); // <--- Success

      this.ngZone.run(() => {
        this.isLoading = false;
        this.onClose();
      });

    } catch (error) {
      console.error('Erro ao salvar compra:', error);
      
      this.ngZone.run(() => {
        this.isLoading = false;
        this.toastr.error('Erro ao processar compra.', 'Ops!'); // <--- Error
      });
    }
  }
}