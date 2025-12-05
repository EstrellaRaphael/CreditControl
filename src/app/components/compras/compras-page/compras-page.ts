import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Compra, Categoria } from '../../../models/core.types';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { LucideAngularModule, Plus, ShoppingBag, Calendar, CreditCard, Trash2, Search, Filter, X } from 'lucide-angular';
import { CompraService } from '../../../services/compra';
import { CategoriaService } from '../../../services/categoria';
import { CompraModalComponent } from '../compra-modal/compra-modal';
import { ToastrService } from 'ngx-toastr';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-compras-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CompraModalComponent, ReactiveFormsModule],
  templateUrl: './compras-page.html'
})
export class ComprasPageComponent {
  private compraService = inject(CompraService);
  private categoriaService = inject(CategoriaService);
  private toastr = inject(ToastrService);

  // Dados brutos
  private comprasRaw$ = this.compraService.getCompras();
  categorias$ = this.categoriaService.getCategorias();

  // Controles de Filtro
  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');
  minPriceControl = new FormControl('');
  maxPriceControl = new FormControl('');

  // Filtros combinados
  filteredCompras$: Observable<Compra[]> = combineLatest([
    this.comprasRaw$,
    this.searchControl.valueChanges.pipe(startWith('')),
    this.categoryControl.valueChanges.pipe(startWith('')),
    this.startDateControl.valueChanges.pipe(startWith('')),
    this.endDateControl.valueChanges.pipe(startWith('')),
    this.minPriceControl.valueChanges.pipe(startWith('')),
    this.maxPriceControl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([compras, search, category, startDate, endDate, minPrice, maxPrice]) => {
      return compras.filter(compra => {
        // Filtro de Texto (Nome)
        const matchesSearch = !search || compra.descricao.toLowerCase().includes(search.toLowerCase());

        // Filtro de Categoria
        const matchesCategory = !category || compra.categoria === category;

        // Filtro de Data
        let matchesDate = true;
        if (startDate) {
          matchesDate = matchesDate && compra.dataCompra >= startDate;
        }
        if (endDate) {
          matchesDate = matchesDate && compra.dataCompra <= endDate;
        }

        // Filtro de Preço
        let matchesPrice = true;
        if (minPrice) {
          matchesPrice = matchesPrice && compra.valorTotal >= Number(minPrice);
        }
        if (maxPrice) {
          matchesPrice = matchesPrice && compra.valorTotal <= Number(maxPrice);
        }

        return matchesSearch && matchesCategory && matchesDate && matchesPrice;
      });
    })
  );

  isModalOpen = false;
  showFilters = false; // Toggle para mobile/desktop se quiser esconder
  readonly icons = {
    plus: Plus,
    bag: ShoppingBag,
    calendar: Calendar,
    card: CreditCard,
    trash: Trash2,
    search: Search,
    filter: Filter,
    x: X
  };

  openNewCompraModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
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

  // Helper para formatar moeda
  formatMoney(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  // Helper para formatar data (YYYY-MM-DD -> DD/MM/YYYY)
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  async deleteCompra(compra: Compra) {
    if (confirm(`Deseja excluir a compra "${compra.descricao}"?`)) {
      try {
        await this.compraService.deleteCompra(compra);
        this.toastr.success('Compra removida.', 'Feito');
      } catch (error) {
        this.toastr.error('Erro ao excluir compra.');
      }
    }
  }
}