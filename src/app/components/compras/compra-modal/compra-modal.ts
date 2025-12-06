import { Component, EventEmitter, Input, Output, OnInit, inject, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LucideAngularModule, X, Check, AlertTriangle } from 'lucide-angular';
import { Cartao, Compra, Categoria } from '../../../models/core.types';
import { Observable } from 'rxjs';
import { CompraService } from '../../../services/compra';
import { CartaoService } from '../../../services/cartao';
import { CategoriaService } from '../../../services/categoria';
import { ToastrService } from 'ngx-toastr';

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
  private categoriaService = inject(CategoriaService);
  private ngZone = inject(NgZone);
  private toastr = inject(ToastrService);

  @Input() isOpen = false;
  @Input() compraToEdit: Compra | null = null; // Input para edição
  @Output() close = new EventEmitter<void>();

  isLoading = false;
  readonly icons = { close: X, check: Check, alert: AlertTriangle };

  // Lista de cartões para o Select
  cartoes$: Observable<Cartao[]> = this.cartaoService.getCartoes();
  cartoesList: Cartao[] = []; // Para busca local ao salvar

  // Categorias dinâmicas
  categorias$: Observable<Categoria[]> = this.categoriaService.getCategorias();

  form: FormGroup = this.fb.group({
    descricao: ['', [Validators.required, Validators.minLength(3)]],
    valorTotal: ['', [Validators.required, Validators.min(0.01)]],
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
        if (parcelasCtrl?.value < 2) parcelasCtrl?.setValue(2);
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

      if (this.compraToEdit) {
        // Modo Edição: Preenche o formulário
        this.form.patchValue({
          descricao: this.compraToEdit.descricao,
          valorTotal: this.compraToEdit.valorTotal,
          dataCompra: this.compraToEdit.dataCompra,
          cartaoId: this.compraToEdit.cartaoId,
          categoria: this.compraToEdit.categoria,
          tipo: this.compraToEdit.tipo,
          qtdParcelas: this.compraToEdit.qtdParcelas || 1
        });
      } else {
        // Modo Criação: Limpa o formulário
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
      this.toastr.warning('O cartão selecionado não foi encontrado.', 'Atenção');
      this.isLoading = false;
      return;
    }

    try {
      if (this.compraToEdit && this.compraToEdit.id) {
        // Atualizar Compra Existente
        await this.compraService.updateCompra(this.compraToEdit.id, {
          descricao: formData.descricao,
          valorTotal: Number(formData.valorTotal),
          dataCompra: formData.dataCompra,
          cartaoId: formData.cartaoId,
          categoria: formData.categoria,
          tipo: formData.tipo,
          qtdParcelas: Number(formData.qtdParcelas)
        }, cartaoSelecionado);
        this.toastr.success('Compra atualizada com sucesso!', 'Atualizado');
      } else {
        // Criar Nova Compra
        await this.compraService.addCompra({
          descricao: formData.descricao,
          valorTotal: Number(formData.valorTotal),
          dataCompra: formData.dataCompra,
          cartaoId: formData.cartaoId,
          categoria: formData.categoria,
          tipo: formData.tipo,
          qtdParcelas: Number(formData.qtdParcelas)
        }, cartaoSelecionado);
        this.toastr.success('Compra lançada com sucesso!', 'Feito!');
      }

      this.ngZone.run(() => {
        this.isLoading = false;
        this.onClose();
      });

    } catch (error) {
      console.error('Erro ao salvar compra:', error);

      this.ngZone.run(() => {
        this.isLoading = false;
        this.toastr.error('Erro ao processar compra.', 'Ops!');
      });
    }
  }
}