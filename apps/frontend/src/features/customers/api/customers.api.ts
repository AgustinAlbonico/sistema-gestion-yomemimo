/**
 * API de clientes
 * Servicios para comunicación con el backend
 */
import { api } from '@/lib/axios';
import {
    Customer,
    CustomerCategory,
    CustomerFilters,
    CustomerStats,
    CreateCustomerDTO,
    UpdateCustomerDTO,
    CreateCustomerCategoryDTO,
    UpdateCustomerCategoryDTO,
    PaginatedResponse,
} from '../types';

export const customersApi = {
    /**
     * Lista clientes con filtros y paginación
     */
    getAll: async (params?: CustomerFilters) => {
        const response = await api.get<PaginatedResponse<Customer>>('/api/customers', { params });
        return response.data;
    },

    /**
     * Lista clientes activos (para selectores)
     */
    getActive: async () => {
        const response = await api.get<Customer[]>('/api/customers/active');
        return response.data;
    },

    /**
     * Obtiene estadísticas de clientes
     */
    getStats: async () => {
        const response = await api.get<CustomerStats>('/api/customers/stats');
        return response.data;
    },

    /**
     * Obtiene un cliente por ID
     */
    getOne: async (id: string) => {
        const response = await api.get<Customer>(`/api/customers/${id}`);
        return response.data;
    },

    /**
     * Crea un nuevo cliente
     */
    create: async (data: CreateCustomerDTO) => {
        const response = await api.post<Customer>('/api/customers', data);
        return response.data;
    },

    /**
     * Actualiza un cliente
     */
    update: async (id: string, data: UpdateCustomerDTO) => {
        const response = await api.patch<Customer>(`/api/customers/${id}`, data);
        return response.data;
    },

    /**
     * Desactiva un cliente
     */
    delete: async (id: string) => {
        const response = await api.delete<{ message: string }>(`/api/customers/${id}`);
        return response.data;
    },
};

export const customerCategoriesApi = {
    /**
     * Lista todas las categorías
     */
    getAll: async () => {
        const response = await api.get<CustomerCategory[]>('/api/customer-categories');
        return response.data;
    },

    /**
     * Lista categorías activas
     */
    getActive: async () => {
        const response = await api.get<CustomerCategory[]>('/api/customer-categories/active');
        return response.data;
    },

    /**
     * Crea una nueva categoría
     */
    create: async (data: CreateCustomerCategoryDTO) => {
        const response = await api.post<CustomerCategory>('/api/customer-categories', data);
        return response.data;
    },

    /**
     * Actualiza una categoría
     */
    update: async (id: string, data: UpdateCustomerCategoryDTO) => {
        const response = await api.patch<CustomerCategory>(`/api/customer-categories/${id}`, data);
        return response.data;
    },

    /**
     * Elimina una categoría
     */
    delete: async (id: string) => {
        const response = await api.delete<{ message: string }>(`/api/customer-categories/${id}`);
        return response.data;
    },
};

