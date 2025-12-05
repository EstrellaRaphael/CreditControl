import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, CreditCard, ShoppingBag, Tag, Info } from 'lucide-angular';

@Component({
    selector: 'app-about-page',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './about-page.html'
})
export class AboutPageComponent {
    readonly icons = {
        dashboard: LayoutDashboard,
        card: CreditCard,
        shopping: ShoppingBag,
        tag: Tag,
        info: Info
    };

    features = [
        {
            title: 'Dashboard',
            description: 'Visão geral das suas finanças. Acompanhe o total da fatura do mês, limite disponível e gráficos de distribuição de gastos.',
            icon: this.icons.dashboard,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            title: 'Meus Cartões',
            description: 'Gerencie seus cartões de crédito. Adicione novos cartões, defina limites, cores e datas de vencimento.',
            icon: this.icons.card,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: 'Minhas Compras',
            description: 'Registre e organize suas compras. Suporte para compras parceladas, recorrentes (assinaturas) e à vista.',
            icon: this.icons.shopping,
            color: 'bg-green-100 text-green-600'
        },
        {
            title: 'Categorias',
            description: 'Crie tags personalizadas para classificar seus gastos e entender melhor para onde vai seu dinheiro.',
            icon: this.icons.tag,
            color: 'bg-orange-100 text-orange-600'
        }
    ];
}
