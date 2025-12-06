import { Compra, Cartao, Parcela } from '../models/core.types';

export class InstallmentCalculator {
    static calculate(compra: Omit<Compra, 'id' | 'userId'>, cartao: Cartao, userId: string, compraId: string): Parcela[] {
        const parcelas: Parcela[] = [];
        const dataCompra = new Date(compra.dataCompra + 'T12:00:00'); // Fuso horário safe
        const diaCompra = dataCompra.getDate();

        // RN002: Lógica do Melhor Dia (Fechamento)
        let mesReferencia = dataCompra.getMonth() + 1; // JS é 0-11
        let anoReferencia = dataCompra.getFullYear();

        // Se comprou DEPOIS ou NO DIA do fechamento, joga para o próximo mês
        if (diaCompra >= cartao.diaFechamento) {
            mesReferencia++;
            if (mesReferencia > 12) {
                mesReferencia = 1;
                anoReferencia++;
            }
        }

        // Determina quantidade de loops
        const qtd = compra.tipo === 'recorrente' ? 12 : (compra.qtdParcelas || 1);
        // Nota: Recorrente criamos 12 meses para frente como MVP.

        // RN003: Cálculo dos valores (Centavos na 1ª parcela)
        const valorTotal = compra.valorTotal;
        const qtdReal = compra.tipo === 'recorrente' ? 1 : (compra.qtdParcelas || 1); // Divisor matemático

        // Se for recorrente, o valor é fixo todo mês. Se for parcelado, divide.
        let valorParcelaBase = 0;
        let primeiraParcela = 0;

        if (compra.tipo === 'recorrente') {
            valorParcelaBase = valorTotal;
            primeiraParcela = valorTotal;
        } else {
            valorParcelaBase = Math.floor((valorTotal / qtdReal) * 100) / 100; // Arredonda para baixo 2 casas
            const diferenca = valorTotal - (valorParcelaBase * qtdReal);
            primeiraParcela = valorParcelaBase + diferenca; // Ajuste de centavos
        }

        for (let i = 1; i <= qtd; i++) {
            // Cria a data de vencimento (dia do vencimento do cartão naquele mês)
            // Nota: JS Date month index é 0-based
            const dataVenc = new Date(anoReferencia, mesReferencia - 1, cartao.diaVencimento);

            parcelas.push({
                userId,
                compraId,
                cartaoId: cartao.id!,
                numeroParcela: i,
                valor: (i === 1 && compra.tipo !== 'recorrente') ? primeiraParcela : valorParcelaBase,
                mesReferencia,
                anoReferencia,
                status: 'PENDENTE',
                dataVencimento: dataVenc.toISOString().split('T')[0]
            });

            // Avança para o próximo mês
            mesReferencia++;
            if (mesReferencia > 12) {
                mesReferencia = 1;
                anoReferencia++;
            }
        }

        return parcelas;
    }
}
