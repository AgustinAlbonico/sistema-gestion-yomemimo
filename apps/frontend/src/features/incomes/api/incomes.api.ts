/**
 * API de ingresos
 * Servicios para comunicación con el backend
 */
import { api } from '@/lib/axios';
import {
    Income,
    IncomeCategory,
    IncomeFilters,
    IncomeStats,
    CreateIncomeDTO,
    UpdateIncomeDTO,
    CreateIncomeCategoryDTO,
    UpdateIncomeCategoryDTO,
    PaginatedIncomes,
} from '../types';

export const incomesApi = {
    /**
     * Lista ingresos con filtros y paginación
     */
    getAll: async (params?: IncomeFilters) => {
        const response = await api.get<PaginatedIncomes>('/api/incomes', { params });
        return response.data;
    },

    /**
     * Obtiene estadísticas de ingresos
     */
    getStats: async (startDate?: string, endDate?: string) => {
        const response = await api.get<IncomeStats>('/api/incomes/stats', {
            params: { startDate, endDate },
        });
        return response.data;
    },

    /**
     * Obtiene un ingreso por ID
     */
    getOne: async (id: string) => {
        const response = await api.get<Income>(`/api/incomes/${id}`);
        return response.data;
    },

    /**
     * Crea un nuevo ingreso
     */
    create: async (data: CreateIncomeDTO) => {
        const response = await api.post<Income>('/api/incomes', data);
        return response.data;
    },

    /**
     * Actualiza un ingreso
     */
    update: async (id: string, data: UpdateIncomeDTO) => {
        const response = await api.patch<Income>(`/api/incomes/${id}`, data);
        return response.data;
    },

    /**
     * Marca un ingreso como cobrado
     */
    markAsPaid: async (id: string, paymentMethodId: string) => {
        const response = await api.patch<Income>(`/api/incomes/${id}/mark-paid`, {
            paymentMethodId,
        });
        return response.data;
    },

    /**
     * Elimina un ingreso
     */
    delete: async (id: string) => {
        const response = await api.delete<{ message: string }>(`/api/incomes/${id}`);
        return response.data;
    },
};

export const incomeCategoriesApi = {
    /**
     * Lista todas las categorías
     */
    getAll: async () => {
        const response = await api.get<IncomeCategory[]>('/api/income-categories');
        return response.data;
    },

    /**
     * Lista categorías activas
     */
    getActive: async () => {
        const response = await api.get<IncomeCategory[]>('/api/income-categories/active');
        return response.data;
    },

    /**
     * Crea una nueva categoría
     */
    create: async (data: CreateIncomeCategoryDTO) => {
        const response = await api.post<IncomeCategory>('/api/income-categories', data);
        return response.data;
    },

    /**
     * Actualiza una categoría
     */
    update: async (id: string, data: UpdateIncomeCategoryDTO) => {
        const response = await api.patch<IncomeCategory>(`/api/income-categories/${id}`, data);
        return response.data;
    },

    /**
     * Elimina una categoría
     */
    delete: async (id: string) => {
        const response = await api.delete<{ message: string }>(`/api/income-categories/${id}`);
        return response.data;
    },

    /**
     * Inicializa categorías por defecto
     */
    seed: async () => {
        const response = await api.post<{ created: number }>('/api/income-categories/seed');
        return response.data;
    },
};
