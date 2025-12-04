import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Compra } from '../../../models/core.types';
import { Observable } from 'rxjs';
import { LucideAngularModule, Plus, ShoppingBag, Calendar, CreditCard, Trash2 } from 'lucide-angular';
import { CompraService } from '../../../services/compra';
import { CompraModalComponent } from '../compra-modal/compra-modal';
import { ToastrService } from 'ngx-toastr';
// Importaremos o modal no próximo passo

@Component({
  selector: 'app-compras-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CompraModalComponent],
  templateUrl: './compras-page.html'
})
export class ComprasPageComponent {
  private compraService = inject(CompraService);
  private toastr = inject(ToastrService);

  compras$: Observable<Compra[]> = this.compraService.getCompras();

  isModalOpen = false;
  readonly icons = { plus: Plus, bag: ShoppingBag, calendar: Calendar, card: CreditCard, trash: Trash2 };

  openNewCompraModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
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
        this.toastr.success('Compra removida.', 'Feito'); // <--- Feedback
      } catch (error) {
        this.toastr.error('Erro ao excluir compra.');
      }
    }
  }
}