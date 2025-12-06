import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Calendar, CreditCard, Check, ChevronLeft, ChevronRight } from 'lucide-angular';
import { DashboardService } from '../../../services/dashboard';
import { CompraService } from '../../../services/compra';
import { CartaoService } from '../../../services/cartao';
import { BehaviorSubject, Subscription, switchMap, forkJoin, of, combineLatest, tap } from 'rxjs';
import { Parcela, Compra, Cartao } from '../../../models/core.types';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';

// Interface estendida para exibição
interface ParcelaEnriquecida extends Parcela {
    nomeCompra: string;
    nomeCartao: string;
    totalParcelas: number;
    tipoCompra: 'avista' | 'parcelado' | 'recorrente';
}

@Component({
    selector: 'app-parcelas-page',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, ConfirmModalComponent],
    templateUrl: './parcelas-page.html'
})
export class ParcelasPageComponent implements OnInit, OnDestroy {
    private dashboardService = inject(DashboardService);
    private compraService = inject(CompraService);
    private cartaoService = inject(CartaoService);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);

    private subscriptions: Subscription[] = [];

    readonly icons = {
        calendar: Calendar,
        card: CreditCard,
        check: Check,
        chevronLeft: ChevronLeft,
        chevronRight: ChevronRight
    };

    // Navegação de mês
    private hoje = new Date();
    mesAtual$ = new BehaviorSubject<number>(this.hoje.getMonth() + 1);
    anoAtual$ = new BehaviorSubject<number>(this.hoje.getFullYear());

    // Dados para enriquecimento
    private comprasMap = new Map<string, Compra>();
    private cartoesMap = new Map<string, Cartao>();

    // Lista de parcelas enriquecidas
    parcelas: ParcelaEnriquecida[] = [];
    isLoading = true;

    // Controle do Modal de Confirmação
    isConfirmModalOpen = false;
    confirmModalConfig = {
        title: '',
        message: '',
        type: 'info' as 'warning' | 'danger' | 'info',
        confirmText: 'Confirmar',
        action: () => { }
    };

    ngOnInit() {
        // Carrega compras e cartões primeiro, depois parcelas
        const mainSub = combineLatest([
            this.compraService.getCompras(),
            this.cartaoService.getCartoes()
        ]).pipe(
            tap(([compras, cartoes]) => {
                // Popula maps para enriquecimento
                this.comprasMap.clear();
                compras.forEach(c => {
                    if (c.id) this.comprasMap.set(c.id, c);
                });

                this.cartoesMap.clear();
                cartoes.forEach(c => {
                    if (c.id) this.cartoesMap.set(c.id, c);
                });
            }),
            switchMap(() => combineLatest([this.mesAtual$, this.anoAtual$])),
            switchMap(([mes, ano]) => {
                this.isLoading = true;
                return this.dashboardService.getParcelasDoMes(mes, ano);
            })
        ).subscribe(parcelas => {
            this.parcelas = parcelas.map(p => {
                const compra = this.comprasMap.get(p.compraId);
                return {
                    ...p,
                    nomeCompra: p.compraDescricao || compra?.descricao || 'Compra',
                    nomeCartao: p.cartaoNome || this.cartoesMap.get(p.cartaoId)?.nome || 'Cartão',
                    totalParcelas: compra?.qtdParcelas || 1,
                    tipoCompra: compra?.tipo || 'parcelado'
                };
            });
            this.isLoading = false;
            this.cdr.detectChanges();
        });
        this.subscriptions.push(mainSub);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    // Helper para nome do mês
    getNomeMes(mes: number): string {
        const data = new Date(2024, mes - 1, 1);
        return data.toLocaleString('pt-BR', { month: 'long' });
    }

    // Navegação entre meses
    mesAnterior() {
        let mes = this.mesAtual$.value - 1;
        let ano = this.anoAtual$.value;
        if (mes < 1) {
            mes = 12;
            ano--;
        }
        this.anoAtual$.next(ano);
        this.mesAtual$.next(mes);
    }

    proximoMes() {
        let mes = this.mesAtual$.value + 1;
        let ano = this.anoAtual$.value;
        if (mes > 12) {
            mes = 1;
            ano++;
        }
        this.anoAtual$.next(ano);
        this.mesAtual$.next(mes);
    }

    // Formata valor em moeda
    formatMoney(valor: number): string {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }

    // Abre modal para confirmar pagamento
    confirmarPagamento(parcela: ParcelaEnriquecida) {
        if (!parcela.id) return;

        this.confirmModalConfig = {
            title: 'Pagar Parcela',
            message: `Confirma o pagamento de ${this.formatMoney(parcela.valor)} para "${parcela.nomeCompra}"?`,
            type: 'info',
            confirmText: 'Pagar',
            action: () => this.processarPagamento(parcela)
        };
        this.isConfirmModalOpen = true;
    }

    closeConfirmModal() {
        this.isConfirmModalOpen = false;
        this.cdr.detectChanges();
    }

    async processarPagamento(parcela: ParcelaEnriquecida) {
        this.isConfirmModalOpen = false;
        if (!parcela.id) return;

        try {
            await this.dashboardService.pagarParcelaIndividual(parcela);
            this.toastr.success('Parcela paga com sucesso!', 'Feito');
        } catch (error) {
            console.error(error);
            this.toastr.error('Erro ao pagar parcela.', 'Erro');
        }
    }
}
