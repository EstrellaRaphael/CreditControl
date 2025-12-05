export interface Cartao {
    id?: string; // O ID vem do Firestore (opcional na criação)
    userId: string;
    nome: string; // "Nubank", "XP"
    bandeira: 'Visa' | 'Mastercard' | 'Elo' | 'Amex';
    limiteTotal: number;
    usado: number; // Campo acumulador para performance (RN001)
    diaFechamento: number;
    diaVencimento: number;
    cor: string; // Hex color
}

// Já deixaremos preparada a interface de Compra para a próxima fase
export interface Compra {
    id?: string;
    userId: string;
    descricao: string;
    valorTotal: number;
    dataCompra: string; // ISO String YYYY-MM-DD
    qtdParcelas: number;
    categoria: string;
    tipo: 'avista' | 'parcelado' | 'recorrente';
    cartaoId: string;
    cartaoNome?: string; // Para facilitar exibição na lista
    cartaoCor?: string;  // Para facilitar exibição na lista
    parcelasPagas?: number;
}

export interface Parcela {
    id?: string;
    userId: string;
    compraId: string;
    cartaoId: string;
    numeroParcela: number; // 1, 2, 3...
    valor: number;
    mesReferencia: number; // 1-12
    anoReferencia: number; // 2024, 2025...
    status: 'PAGO' | 'PENDENTE';
    dataVencimento: string; // YYYY-MM-DD (Calculada baseada no cartão)
}