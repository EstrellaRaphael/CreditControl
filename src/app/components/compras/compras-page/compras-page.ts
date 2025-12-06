import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Compra, Categoria } from '../../../models/core.types';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Plus, ShoppingBag, Calendar, CreditCard, Trash2, Search, Filter, X, Edit } from 'lucide-angular';
import { CompraService } from '../../../services/compra';
import { CategoriaService } from '../../../services/categoria';
import { CompraModalComponent } from '../compra-modal/compra-modal';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-compras-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CompraModalComponent, ConfirmModalComponent, ReactiveFormsModule, SkeletonComponent, EmptyStateComponent],
  templateUrl: './compras-page.html'
})
export class ComprasPageComponent implements OnInit, OnDestroy {
  private compraService = inject(CompraService);
  private categoriaService = inject(CategoriaService);
  private toastr = inject(ToastrService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  compras: Compra[] = [];
  categorias: Categoria[] = [];
  private subscriptions: Subscription[] = [];

  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');
  minPriceControl = new FormControl('');
  maxPriceControl = new FormControl('');

  isModalOpen = false;
  editingCompra: Compra | null = null;
  showFilters = false;
  isLoading = true;

  isConfirmModalOpen = false;
  confirmModalConfig = {
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    confirmText: 'Confirmar',
    action: () => { }
  };

  readonly icons = {
    plus: Plus,
    bag: ShoppingBag,
    calendar: Calendar,
    card: CreditCard,
    trash: Trash2,
    search: Search,
    filter: Filter,
    x: X,
    edit: Edit
  };

  ngOnInit() {
    // Check for ?action=new query param from FAB
    const querySub = this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        setTimeout(() => this.openNewCompraModal(), 100);
      }
    });
    this.subscriptions.push(querySub);

    const comprasSub = this.compraService.getCompras().subscribe(data => {
      this.compras = data;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
    this.subscriptions.push(comprasSub);

    const catSub = this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
      this.cdr.detectChanges();
    });
    this.subscriptions.push(catSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  get filteredCompras(): Compra[] {
    const search = this.searchControl.value?.toLowerCase() || '';
    const category = this.categoryControl.value || '';
    const startDate = this.startDateControl.value || '';
    const endDate = this.endDateControl.value || '';
    const minPrice = this.minPriceControl.value ? Number(this.minPriceControl.value) : null;
    const maxPrice = this.maxPriceControl.value ? Number(this.maxPriceControl.value) : null;

    return this.compras.filter(compra => {
      const matchesSearch = !search || compra.descricao.toLowerCase().includes(search);
      const matchesCategory = !category || compra.categoria === category;
      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && compra.dataCompra >= startDate;
      if (endDate) matchesDate = matchesDate && compra.dataCompra <= endDate;
      let matchesPrice = true;
      if (minPrice !== null) matchesPrice = matchesPrice && compra.valorTotal >= minPrice;
      if (maxPrice !== null) matchesPrice = matchesPrice && compra.valorTotal <= maxPrice;
      return matchesSearch && matchesCategory && matchesDate && matchesPrice;
    });
  }

  openNewCompraModal() {
    this.editingCompra = null;
    this.isModalOpen = true;
  }

  editCompra(compra: Compra) {
    this.editingCompra = compra;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingCompra = null;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.startDateControl.setValue('');
    this.endDateControl.setValue('');
    this.minPriceControl.setValue('');
    this.maxPriceControl.setValue('');
  }

  formatMoney(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  deleteCompra(compra: Compra) {
    this.confirmModalConfig = {
      title: 'Excluir Compra',
      message: `Deseja excluir a compra "${compra.descricao}"? Essa ação não pode ser desfeita.`,
      type: 'danger',
      confirmText: 'Excluir',
      action: () => this.processarExclusao(compra)
    };
    this.isConfirmModalOpen = true;
    this.cdr.detectChanges();
  }

  async processarExclusao(compra: Compra) {
    this.isConfirmModalOpen = false;
    try {
      await this.compraService.deleteCompra(compra);
      this.toastr.success('Compra removida.', 'Feito');
    } catch (error) {
      this.toastr.error('Erro ao excluir compra.');
    }
  }

  closeConfirmModal() {
    this.isConfirmModalOpen = false;
    this.cdr.detectChanges();
  }
}