import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingDown, Wallet, Calendar, ArrowRight, ArrowLeft, Check, CreditCard } from 'lucide-angular';
import { Observable, BehaviorSubject, switchMap, map } from 'rxjs';
import { Router } from '@angular/router';
import { NgxChartsModule, Color, ScaleType, LegendPosition, BarChartModule, PieChartModule } from '@swimlane/ngx-charts';

import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { WelcomeBannerComponent } from '../shared/welcome-banner/welcome-banner.component';
import { CardComponent } from '../ui/card/card.component';
import { ButtonComponent } from '../ui/button/button.component';
import { DashboardService } from '../../services/dashboard';
import { Cartao, Parcela } from '../../models/core.types';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NgxChartsModule, ConfirmModalComponent, SkeletonComponent, WelcomeBannerComponent, CardComponent, ButtonComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  navigateToCartoes = () => {
    this.router.navigate(['/cartoes']);
  };

  // Controle de Data
  currentDate = new Date();
  dateControl$ = new BehaviorSubject<{ mes: number, ano: number }>({
    mes: this.currentDate.getMonth() + 1,
    ano: this.currentDate.getFullYear()
  });

  // Controle do Modal
  isModalOpen = false;
  modalConfig = {
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    confirmText: 'Confirmar',
    action: () => { }
  };

  public LegendPosition = LegendPosition;

  readonly icons = { trending: TrendingDown, wallet: Wallet, calendar: Calendar, prev: ArrowLeft, next: ArrowRight, check: Check, creditCard: CreditCard };

  // Dados reativos que vêm do Service (já combinados: cartoes + parcelas)
  dashboardData$ = this.dateControl$.pipe(
    switchMap(date => this.dashboardService.getDashboardData(date.mes, date.ano)),
    map(data => ({
      ...data,
      chartData: this.getCategoryData(data.parcelas, data.cartoes)
    }))
  );

  // NOVO: Dados exclusivos para o Histórico
  historicoData$ = this.dateControl$.pipe(
    switchMap(date => this.dashboardService.getHistorico(date.mes, date.ano))
  );

  // Configurações dos Gráficos
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  };

  ngOnInit() { }

  // Navegação de Mês
  changeMonth(delta: number) {
    const current = this.dateControl$.value;
    let novoMes = current.mes + delta;
    let novoAno = current.ano;

    if (novoMes > 12) {
      novoMes = 1;
      novoAno++;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno--;
    }

    this.dateControl$.next({ mes: novoMes, ano: novoAno });
  }

  // --- Helpers de Cálculo ---

  getTotalFatura(parcelas: Parcela[]): number {
    return parcelas.reduce((acc, p) => acc + p.valor, 0);
  }

  getLimiteDisponivelGlobal(cartoes: Cartao[]): number {
    return cartoes.reduce((acc, c) => acc + (c.limiteTotal - c.usado), 0);
  }

  getLimiteTotalGlobal(cartoes: Cartao[]): number {
    return cartoes.reduce((acc, c) => acc + c.limiteTotal, 0);
  }

  // Prepara dados para o Gráfico de Categorias (Donut)
  getCategoryData(parcelas: Parcela[], cartoes: Cartao[]): any[] {
    const agrupado = parcelas.reduce((acc: any, curr) => {
      const key = curr.cartaoId;
      acc[key] = (acc[key] || 0) + curr.valor;
      return acc;
    }, {});

    return Object.keys(agrupado).map(key => {
      const cartaoEncontrado = cartoes.find(c => c.id === key);
      const nomeVisual = cartaoEncontrado ? cartaoEncontrado.nome : 'Cartão Excluído';

      return {
        name: nomeVisual,
        value: agrupado[key]
      };
    });
  }

  // NOVO: Agrupa parcelas por categoria e retorna as top 5
  getTopCategorias(parcelas: Parcela[]): { name: string, value: number }[] {
    const agrupado = parcelas.reduce((acc: Record<string, number>, curr) => {
      // Use compraDescricao since Parcela doesn't have categoria directly
      const key = (curr as any).categoria || curr.compraDescricao || 'Sem Categoria';
      acc[key] = (acc[key] || 0) + curr.valor;
      return acc;
    }, {});

    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  // Helper para nome do mês
  getMonthName(mes: number): string {
    return new Date(2024, mes - 1, 1).toLocaleString('pt-BR', { month: 'long' });
  }

  formatMoney(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  getVencimentoFormatado(cartao: Cartao, dataAtual: { mes: number, ano: number }): string {
    const dia = cartao.diaVencimento.toString().padStart(2, '0');
    const mes = dataAtual.mes.toString().padStart(2, '0');
    return `${dia}/${mes}`;
  }

  isFaturaPaga(parcelas: Parcela[]): boolean {
    if (parcelas.length === 0) return true;
    return !parcelas.some(p => p.status === 'PENDENTE');
  }

  pagarFatura() {
    const current = this.dateControl$.value;
    const mesNome = this.getMonthName(current.mes);

    this.modalConfig = {
      title: 'Pagar Fatura',
      message: `Deseja confirmar o pagamento da fatura de ${mesNome}? Isso irá liberar o limite dos seus cartões.`,
      type: 'warning',
      confirmText: 'Pagar Fatura',
      action: () => this.processarPagamento()
    };
    this.isModalOpen = true;
  }

  async processarPagamento() {
    this.isModalOpen = false;
    const current = this.dateControl$.value;

    try {
      const qtdPagas = await this.dashboardService.pagarFaturaMensal(current.mes, current.ano);

      if (qtdPagas > 0) {
        this.toastr.success(`${qtdPagas} parcelas baixadas com sucesso!`, 'Fatura Paga');
        this.toastr.info('Seu limite disponível foi atualizado.', 'Limite Liberado');
      } else {
        this.toastr.warning('Nenhuma parcela pendente encontrada.', 'Aviso');
      }
    } catch (error) {
      console.error(error);
      this.toastr.error('Erro ao processar pagamento.', 'Erro');
    }
  }
}
