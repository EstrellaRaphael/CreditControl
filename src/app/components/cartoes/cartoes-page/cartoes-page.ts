import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Plus, CreditCard, Trash2, Edit } from 'lucide-angular';
import { Observable } from 'rxjs';
import { Cartao } from '../../../models/core.types';
import { CartaoModalComponent } from '../cartao-modal/cartao-modal';
import { CartaoService } from '../../../services/cartao';
import { HouseholdService } from '../../../services/household.service';
import { ToastrService } from 'ngx-toastr';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-cartoes-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CartaoModalComponent, ConfirmModalComponent, SkeletonComponent, EmptyStateComponent, ButtonComponent],
  templateUrl: './cartoes-page.html'
})
export class CartoesPage implements OnInit {
  private cartaoService: CartaoService = inject(CartaoService);
  private householdService = inject(HouseholdService);
  private toastr = inject(ToastrService);

  private route = inject(ActivatedRoute);

  cartoes$: Observable<Cartao[]> = this.cartaoService.getCartoes();

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        setTimeout(() => this.openNewCartaoModal(), 100);
      }
    });
  }

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

  // Funções para abrir/fechar
  openNewCartaoModal() {
    if (!this.householdService.hasPermission('manageCards')) {
      this.toastr.warning('Você não tem permissão para adicionar cartões', 'Acesso negado');
      return;
    }
    this.editingCartao = null;
    this.isModalOpen = true;
  }

  editCartao(cartao: Cartao) {
    if (!this.householdService.hasPermission('manageCards')) {
      this.toastr.warning('Você não tem permissão para editar cartões', 'Acesso negado');
      return;
    }
    this.editingCartao = cartao;
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