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
    // Rastreamento
    createdBy?: string;
    createdByName?: string;
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
    // Rastreamento
    createdBy?: string;
    createdByName?: string;
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
    // Rastreamento
    createdBy?: string;
    createdByName?: string;
}

// ========== Household (Shared Accounts) ==========

export interface MemberPermissions {
    viewDashboard: boolean;
    manageCards: boolean;
    managePurchases: boolean;
    manageCategories: boolean;
    payInvoices: boolean;
}

export const DEFAULT_MEMBER_PERMISSIONS: MemberPermissions = {
    viewDashboard: true,
    manageCards: false,
    managePurchases: false,
    manageCategories: false,
    payInvoices: false
};

export const OWNER_PERMISSIONS: MemberPermissions = {
    viewDashboard: true,
    manageCards: true,
    managePurchases: true,
    manageCategories: true,
    payInvoices: true
};

export interface Household {
    id?: string;
    name: string;
    ownerId: string;
    createdAt: string;
}

export interface HouseholdMember {
    id?: string; // Same as the user's UID
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'owner' | 'member';
    permissions: MemberPermissions;
    joinedAt: string;
}

export interface HouseholdInvite {
    id?: string;
    householdId: string;
    householdName: string;
    invitedBy: string;
    invitedByName: string;
    token: string;
    createdAt: string;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'expired';
}