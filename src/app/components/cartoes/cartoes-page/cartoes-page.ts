import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, CreditCard, Trash2, Edit } from 'lucide-angular';
import { Observable } from 'rxjs';
import { Cartao } from '../../../models/core.types';
import { CartaoModalComponent } from '../cartao-modal/cartao-modal';
import { CartaoService } from '../../../services/cartao';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-cartoes-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CartaoModalComponent, ConfirmModalComponent],
  templateUrl: './cartoes-page.html'
})
export class CartoesPage {
  private cartaoService: CartaoService = inject(CartaoService);
  private toastr = inject(ToastrService);

  cartoes$: Observable<Cartao[]> = this.cartaoService.getCartoes();

  // Controle do Modal
  isModalOpen = false;
  editingCartao: Cartao | null = null;

  // Controle do Modal de Confirmação
  isConfirmModalOpen = false;
  confirmModalConfig = {
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    confirmText: 'Confirmar',
    action: () => { }
  };

  readonly icons = { plus: Plus, card: CreditCard, trash: Trash2, edit: Edit };

  getPorcentagemUso(usado: number, total: number): number {
    if (total === 0) return 0;
    return Math.min((usado / total) * 100, 100);
  }

  formatMoney(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  // 3. Funções para abrir/fechar
  openNewCartaoModal() {
    this.editingCartao = null; // Garante que não é edição
    this.isModalOpen = true;
  }

  editCartao(cartao: Cartao) {
    this.editingCartao = cartao; // Passa os dados para o modal
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingCartao = null;
  }

  deleteCartao(cartao: Cartao) {
    if (!cartao.id) return;

    this.confirmModalConfig = {
      title: 'Excluir Cartão',
      message: `Tem certeza que deseja excluir o cartão ${cartao.nome}? Isso não apagará as compras já realizadas.`,
      type: 'danger',
      confirmText: 'Excluir',
      action: () => this.processarExclusao(cartao.id!)
    };
    this.isConfirmModalOpen = true;
  }

  async processarExclusao(cartaoId: string) {
    this.isConfirmModalOpen = false;
    try {
      await this.cartaoService.deleteCartao(cartaoId);
      this.toastr.success('Cartão excluído com sucesso.');
    } catch (error) {
      this.toastr.error('Erro ao excluir cartão.');
    }
  }
}