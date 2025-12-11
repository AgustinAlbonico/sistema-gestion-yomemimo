/**
 * Tipos del módulo de ingresos
 */
import { PaymentMethod as PaymentMethodEntity } from '@/features/configuration/api/payment-methods.api';

export interface IncomeCategory {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    businessName?: string | null;
    email?: string | null;
    phone?: string | null;
}

export interface Income {
    id: string;
    description: string;
    amount: number;
    incomeDate: string;
    category?: IncomeCategory | null;
    categoryId?: string | null;
    customer?: Customer | null;
    customerId?: string | null;
    customerName?: string | null;
    isOnAccount: boolean;
    paymentMethod?: PaymentMethodEntity | null;
    paymentMethodId?: string | null;
    receiptNumber?: string | null;
    isPaid: boolean;
    paidAt?: string | null;
    notes?: string | null;
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIncomeDTO {
    description: string;
    amount: number;
    incomeDate: string;
    categoryId?: string;
    customerId?: string;
    customerName?: string;
    isOnAccount?: boolean;
    paymentMethodId?: string;
    receiptNumber?: string;
    isPaid?: boolean;
    notes?: string;
}

export interface UpdateIncomeDTO extends Partial<CreateIncomeDTO> { }

export interface IncomeFilters {
    categoryId?: string;
    customerId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
    isOnAccount?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'incomeDate' | 'amount' | 'createdAt';
    order?: 'ASC' | 'DESC';
}

export interface CreateIncomeCategoryDTO {
    name: string;
    description?: string;
}

export interface UpdateIncomeCategoryDTO extends Partial<CreateIncomeCategoryDTO> { }

export interface IncomeStats {
    totalIncomes: number;
    totalAmount: number;
    totalPending: number;
    byCategory: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
        total: number;
    }>;
}

export interface PaginatedIncomes {
    data: Income[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
