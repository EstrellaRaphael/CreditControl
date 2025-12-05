import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-angular';

@Component({
    selector: 'app-help-page',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './help-page.html'
})
export class HelpPageComponent {
    readonly icons = {
        help: HelpCircle,
        down: ChevronDown,
        up: ChevronUp,
        mail: Mail,
        message: MessageCircle
    };

    openFaqIndex: number | null = null;

    faqs = [
        {
            question: 'Como cadastro um novo cartão?',
            answer: 'Vá até a página "Meus Cartões" e clique no botão "Novo Cartão". Preencha os dados como nome, limite e dia de vencimento.'
        },
        {
            question: 'O que acontece quando pago uma fatura?',
            answer: 'Ao confirmar o pagamento da fatura no Dashboard, o limite utilizado dos seus cartões é liberado proporcionalmente aos gastos daquele mês, e as parcelas são marcadas como pagas.'
        },
        {
            question: 'Como funcionam as compras parceladas?',
            answer: 'Ao cadastrar uma compra, selecione a opção "Parcelado" e informe o número de vezes. O sistema criará automaticamente uma parcela para cada mês subsequente.'
        },
        {
            question: 'Posso editar uma categoria?',
            answer: 'Sim! Na página de Categorias, você pode criar novas tags com cores personalizadas e excluir as que não usa mais.'
        },
        {
            question: 'Meus dados estão seguros?',
            answer: 'Sim. Utilizamos autenticação via Google e seus dados são armazenados de forma segura no Firebase Firestore, com regras de privacidade estritas.'
        }
    ];

    toggleFaq(index: number) {
        if (this.openFaqIndex === index) {
            this.openFaqIndex = null;
        } else {
            this.openFaqIndex = index;
        }
    }
}
