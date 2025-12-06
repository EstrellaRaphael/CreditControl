import { describe, it, expect } from 'vitest';
import { InstallmentCalculator } from './installment-calculator';
import { Compra, Cartao } from '../models/core.types';

describe('InstallmentCalculator', () => {
    const mockCartao: Cartao = {
        id: 'cartao1',
        nome: 'Nubank',
        cor: '#820ad1',
        limiteTotal: 1000,
        usado: 0,
        diaFechamento: 5,
        diaVencimento: 10,
        userId: 'user1',
        bandeira: 'Mastercard'
    };

    it('should calculate installments correctly for a simple purchase before closing date', () => {
        const compra: Omit<Compra, 'id' | 'userId'> = {
            descricao: 'Compra Simples',
            valorTotal: 100,
            dataCompra: '2024-01-01', // Antes do fechamento (05)
            tipo: 'parcelado',
            qtdParcelas: 2,
            categoria: 'cat1',
            cartaoId: 'cartao1'
        };

        const parcelas = InstallmentCalculator.calculate(compra, mockCartao, 'user1', 'compra1');

        expect(parcelas.length).toBe(2);
        // Vencimento em Janeiro (mesmo mês)
        expect(parcelas[0].mesReferencia).toBe(1);
        expect(parcelas[0].valor).toBe(50);
        expect(parcelas[1].mesReferencia).toBe(2);
        expect(parcelas[1].valor).toBe(50);
    });

    it('should calculate installments correctly for a purchase after closing date (Best Day)', () => {
        const compra: Omit<Compra, 'id' | 'userId'> = {
            descricao: 'Compra Melhor Dia',
            valorTotal: 100,
            dataCompra: '2024-01-06', // Depois do fechamento (05)
            tipo: 'parcelado',
            qtdParcelas: 1,
            categoria: 'cat1',
            cartaoId: 'cartao1'
        };

        const parcelas = InstallmentCalculator.calculate(compra, mockCartao, 'user1', 'compra1');

        expect(parcelas.length).toBe(1);
        // Vencimento em Fevereiro (próximo mês)
        expect(parcelas[0].mesReferencia).toBe(2);
        expect(parcelas[0].anoReferencia).toBe(2024);
    });

    it('should handle cent differences in the first installment', () => {
        const compra: Omit<Compra, 'id' | 'userId'> = {
            descricao: 'Compra Quebrada',
            valorTotal: 100,
            dataCompra: '2024-01-01',
            tipo: 'parcelado',
            qtdParcelas: 3,
            categoria: 'cat1',
            cartaoId: 'cartao1'
        };

        // 100 / 3 = 33.333...
        // Base = 33.33
        // Diferença = 100 - (33.33 * 3) = 100 - 99.99 = 0.01
        // 1ª Parcela = 33.33 + 0.01 = 33.34

        const parcelas = InstallmentCalculator.calculate(compra, mockCartao, 'user1', 'compra1');

        expect(parcelas.length).toBe(3);
        expect(parcelas[0].valor).toBeCloseTo(33.34);
        expect(parcelas[1].valor).toBeCloseTo(33.33);
        expect(parcelas[2].valor).toBeCloseTo(33.33);

        const total = parcelas.reduce((acc, p) => acc + p.valor, 0);
        expect(total).toBeCloseTo(100);
    });

    it('should generate 12 installments for recurring purchases', () => {
        const compra: Omit<Compra, 'id' | 'userId'> = {
            descricao: 'Netflix',
            valorTotal: 50,
            dataCompra: '2024-01-01',
            tipo: 'recorrente',
            categoria: 'cat1',
            cartaoId: 'cartao1',
            qtdParcelas: 1
        };

        const parcelas = InstallmentCalculator.calculate(compra, mockCartao, 'user1', 'compra1');

        expect(parcelas.length).toBe(12);
        expect(parcelas[0].valor).toBe(50);
        expect(parcelas[11].valor).toBe(50);
    });

    it('should handle year rollover correctly', () => {
        const compra: Omit<Compra, 'id' | 'userId'> = {
            descricao: 'Compra Fim de Ano',
            valorTotal: 100,
            dataCompra: '2024-12-20', // Depois do fechamento
            tipo: 'parcelado',
            qtdParcelas: 1,
            categoria: 'cat1',
            cartaoId: 'cartao1'
        };

        const parcelas = InstallmentCalculator.calculate(compra, mockCartao, 'user1', 'compra1');

        expect(parcelas[0].mesReferencia).toBe(1);
        expect(parcelas[0].anoReferencia).toBe(2025);
    });
});
