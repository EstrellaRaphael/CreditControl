export interface Cartao {
    id?: string;
    userId: string;
    nome: string;
    bandeira: 'Visa' | 'Mastercard' | 'Elo' | 'Amex';
    limiteTotal: number;
    usado: number;
    diaFechamento: number;
    diaVencimento: number;
    cor: string;
}

export interface Compra {
    id?: string;
    userId: string;
    descricao: string;
    valorTotal: number;
    dataCompra: string;
    qtdParcelas: number;
    categoria: string;
    tipo: 'avista' | 'parcelado' | 'recorrente';
    cartaoId: string;
    cartaoNome?: string;
    cartaoCor?: string;
    parcelasPagas?: number;
    status?: 'ativa' | 'cancelada';
    dataCancelamento?: string;
}

export interface Parcela {
    id?: string;
    userId: string;
    compraId: string;
    cartaoId: string;
    numeroParcela: number;
    valor: number;
    mesReferencia: number;
    anoReferencia: number;
    status: 'PAGO' | 'PENDENTE';
    dataVencimento: string;
    // Denormalizado para exibição
    compraDescricao?: string;
    cartaoNome?: string;
}

export interface Categoria {
    id?: string;
    userId: string;
    nome: string;
    cor?: string;
}