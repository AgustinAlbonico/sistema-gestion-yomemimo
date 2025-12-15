/**
 * Tipos e interfaces para el módulo de cuentas corrientes
 */

// Enums
export enum AccountStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    CLOSED = 'closed',
}

export enum MovementType {
    CHARGE = 'charge',
    PAYMENT = 'payment',
    ADJUSTMENT = 'adjustment',
    DISCOUNT = 'discount',
    INTEREST = 'interest',
}

export type CustomerPosition = 'customer_owes' | 'business_owes' | 'settled';

// Entidades
export interface CustomerAccount {
    id: string;
    customerId: string;
    customer?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
    };
    balance: number;
    creditLimit: number;
    status: AccountStatus;
    daysOverdue: number;
    lastPaymentDate: Date | null;
    lastPurchaseDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AccountMovement {
    id: string;
    accountId: string;
    movementType: MovementType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    referenceType: string | null;
    referenceId: string | null;
    paymentMethod?: {
        id: string;
        name: string;
        type: string;
    } | null;
    notes: string | null;
    createdBy?: {
        id: string;
        username: string;
        name: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}

// DTOs
export interface CreateChargeDto {
    amount: number;
    description: string;
    saleId?: string;
    notes?: string;
}

export interface CreatePaymentDto {
    amount: number;
    paymentMethodId: string;
    description?: string;
    notes?: string;
}

export interface UpdateAccountDto {
    creditLimit?: number;
    status?: AccountStatus;
}

export type SurchargeType = 'percentage' | 'fixed';

export interface ApplySurchargeDto {
    surchargeType: SurchargeType;
    value: number;
    description?: string;
}

export interface AccountFiltersDto {
    page?: number;
    limit?: number;
    status?: AccountStatus;
    hasDebt?: boolean;
    isOverdue?: boolean;
    search?: string;
}

// Respuestas
export interface AccountStatementSummary {
    totalCharges: number;
    totalPayments: number;
    currentBalance: number;
    customerPosition: CustomerPosition;
}

export interface AccountStatement {
    account: CustomerAccount;
    movements: AccountMovement[];
    summary: AccountStatementSummary;
}

export interface AccountStats {
    totalAccounts: number;
    activeAccounts: number;
    suspendedAccounts: number;
    totalDebtors: number;
    totalDebt: number;
    averageDebt: number;
    overdueAccounts: number;
    totalOverdue: number;
}

export interface OverdueAlert {
    customerId: string;
    customerName: string;
    balance: number;
    daysOverdue: number;
    lastPaymentDate: Date | null;
}

export interface PaginatedAccounts {
    data: CustomerAccount[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Venta pendiente de pago (a cuenta corriente)
 */
export interface PendingSale {
    id: string;
    saleNumber: string;
    customerId: string;
    customer?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    saleDate: string;
    subtotal: number;
    discount: number;
    surcharge: number;
    tax: number;
    total: number;
    status: string;
    isOnAccount: boolean;
    notes: string | null;
    items: Array<{
        id: string;
        productId: string;
        productDescription: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }>;
}

/**
 * Ingreso pendiente de cobro (a cuenta corriente)
 */
export interface PendingIncome {
    id: string;
    description: string;
    amount: number;
    incomeDate: string;
    customerId: string;
    customer?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    category?: {
        id: string;
        name: string;
    };
    isOnAccount: boolean;
    isPaid: boolean;
    notes: string | null;
}

/**
 * Respuesta del endpoint de transacciones pendientes
 */
export interface PendingTransactions {
    sales: PendingSale[];
    incomes: PendingIncome[];
}
