/**
 * API de compras
 * Funciones para comunicarse con el backend
 */
import { api } from '@/lib/axios';
import {
    Purchase,
    CreatePurchaseDTO,
    UpdatePurchaseDTO,
    PurchaseFilters,
    PurchaseStats,
    PaginatedPurchases,
} from '../types';

export const purchasesApi = {
    /**
     * Obtiene compras con filtros y paginación
     */
    getAll: async (params?: PurchaseFilters): Promise<PaginatedPurchases> => {
        const response = await api.get<PaginatedPurchases>('/api/purchases', { params });
        return response.data;
    },

    /**
     * Obtiene una compra por ID
     */
    getOne: async (id: string): Promise<Purchase> => {
        const response = await api.get<Purchase>(`/api/purchases/${id}`);
        return response.data;
    },

    /**
     * Crea una nueva compra
     */
    create: async (data: CreatePurchaseDTO): Promise<Purchase> => {
        const response = await api.post<Purchase>('/api/purchases', data);
        return response.data;
    },

    /**
     * Actualiza una compra
     */
    update: async (id: string, data: UpdatePurchaseDTO): Promise<Purchase> => {
        const response = await api.patch<Purchase>(`/api/purchases/${id}`, data);
        return response.data;
    },

    /**
     * Marca una compra como pagada
     */
    markAsPaid: async (id: string, paymentMethodId: string): Promise<Purchase> => {
        const response = await api.patch<Purchase>(`/api/purchases/${id}/mark-paid`, { paymentMethodId });
        return response.data;
    },

    /**
     * Elimina una compra
     */
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/api/purchases/${id}`);
        return response.data;
    },

    /**
     * Obtiene estadísticas de compras
     */
    getStats: async (startDate?: string, endDate?: string): Promise<PurchaseStats> => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get<PurchaseStats>('/api/purchases/stats', { params });
        return response.data;
    },

    /**
     * Obtiene lista de proveedores para autocompletado
     */
    getProviders: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/api/purchases/providers');
        return response.data;
    },
};

