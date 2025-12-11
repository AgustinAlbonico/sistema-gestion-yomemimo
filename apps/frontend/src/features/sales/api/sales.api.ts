/**
 * API de ventas
 * Funciones para comunicarse con el backend
 */
import { api } from '@/lib/axios';
import {
    Sale,
    CreateSaleDTO,
    UpdateSaleDTO,
    SaleFilters,
    SaleStats,
    PaginatedSales,
    CreateSalePaymentDTO,
    Invoice,
    AfipStatus,
} from '../types';

export const salesApi = {
    /**
     * Obtiene ventas con filtros y paginación
     */
    getAll: async (params?: SaleFilters): Promise<PaginatedSales> => {
        const response = await api.get<PaginatedSales>('/api/sales', { params });
        return response.data;
    },

    /**
     * Obtiene una venta por ID
     */
    getOne: async (id: string): Promise<Sale> => {
        const response = await api.get<Sale>(`/api/sales/${id}`);
        return response.data;
    },

    /**
     * Crea una nueva venta
     */
    create: async (data: CreateSaleDTO): Promise<Sale> => {
        const response = await api.post<Sale>('/api/sales', data);
        return response.data;
    },

    /**
     * Actualiza una venta
     */
    update: async (id: string, data: UpdateSaleDTO): Promise<Sale> => {
        const response = await api.patch<Sale>(`/api/sales/${id}`, data);
        return response.data;
    },

    /**
     * Cancela una venta
     */
    cancel: async (id: string): Promise<Sale> => {
        const response = await api.patch<Sale>(`/api/sales/${id}/cancel`);
        return response.data;
    },

    /**
     * Marca una venta pendiente como pagada
     */
    markAsPaid: async (
        id: string,
        payments: CreateSalePaymentDTO[]
    ): Promise<Sale> => {
        const response = await api.patch<Sale>(`/api/sales/${id}/pay`, { payments });
        return response.data;
    },

    /**
     * Elimina una venta
     */
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/api/sales/${id}`);
        return response.data;
    },

    /**
     * Obtiene estadísticas de ventas
     */
    getStats: async (startDate?: string, endDate?: string): Promise<SaleStats> => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get<SaleStats>('/api/sales/stats', { params });
        return response.data;
    },

    /**
     * Obtiene ventas del día actual
     */
    getTodaySales: async (): Promise<Sale[]> => {
        const response = await api.get<Sale[]>('/api/sales/today');
        return response.data;
    },
};

/**
 * API de facturación fiscal
 */
export const invoicesApi = {
    /**
     * Genera una factura fiscal para una venta
     */
    generate: async (saleId: string): Promise<Invoice> => {
        const response = await api.post<Invoice>(`/api/invoices/generate/${saleId}`);
        return response.data;
    },

    /**
     * Reintenta la autorización de una factura con error
     */
    retry: async (invoiceId: string): Promise<Invoice> => {
        const response = await api.post<Invoice>(`/api/invoices/${invoiceId}/retry`);
        return response.data;
    },

    /**
     * Obtiene una factura por ID
     */
    getOne: async (invoiceId: string): Promise<Invoice> => {
        const response = await api.get<Invoice>(`/api/invoices/${invoiceId}`);
        return response.data;
    },

    /**
     * Obtiene la factura de una venta
     */
    getBySale: async (saleId: string): Promise<Invoice | null> => {
        const response = await api.get<Invoice | null>(`/api/invoices/sale/${saleId}`);
        return response.data;
    },

    /**
     * Obtiene el HTML de la factura (para visualizar)
     */
    getInvoiceHtml: (invoiceId: string): string => {
        return `/api/invoices/${invoiceId}/html`;
    },

    /**
     * Obtiene el PDF de la factura
     */
    getInvoicePdf: (invoiceId: string): string => {
        return `/api/invoices/${invoiceId}/pdf`;
    },

    /**
     * Obtiene el recibo de una venta (no fiscal)
     */
    getReceiptHtml: (saleId: string): string => {
        return `/api/invoices/sale/${saleId}/receipt`;
    },

    /**
     * Obtiene el PDF de la nota de venta (no fiscal)
     */
    getSaleNotePdfUrl: (saleId: string): string => {
        return `/api/invoices/sale/${saleId}/note-pdf`;
    },

    /**
     * Verifica el estado de conexión con AFIP
     */
    getAfipStatus: async (): Promise<AfipStatus> => {
        const response = await api.get<AfipStatus>('/api/invoices/afip/status');
        return response.data;
    },
};

