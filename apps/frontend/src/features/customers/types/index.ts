/**
 * Tipos para el módulo de clientes
 */

import { IvaCondition } from '@/types/iva-condition';

export type DocumentType = 'DNI' | 'CUIT' | 'CUIL' | 'PASAPORTE' | 'OTRO';

export interface CustomerCategory {
    id: string;
    name: string;
    description?: string;
    color?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    documentType?: DocumentType;
    ivaCondition?: IvaCondition;
    documentNumber?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    categoryId?: string;
    category?: CustomerCategory;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerDTO {
    firstName: string;
    lastName: string;
    documentType?: DocumentType;
    ivaCondition?: IvaCondition;
    documentNumber?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    categoryId?: string;
    notes?: string;
    isActive?: boolean;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> { }

export interface CustomerFilters {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    city?: string;
    state?: string;
    sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
    order?: 'ASC' | 'DESC';
}

export interface CustomerStats {
    total: number;
    active: number;
    inactive: number;
    byCategory: Array<{
        categoryName: string;
        count: number;
    }>;
}

export interface CreateCustomerCategoryDTO {
    name: string;
    description?: string;
    color?: string;
    isActive?: boolean;
}

export interface UpdateCustomerCategoryDTO extends Partial<CreateCustomerCategoryDTO> { }

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

