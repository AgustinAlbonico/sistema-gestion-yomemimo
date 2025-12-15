/**
 * API de Inventario - Gestión de stock y movimientos
 */
import { api } from '@/lib/axios';
import {
    Product,
    StockMovement,
    CreateStockMovementDTO,
    InventoryStats,
    ProductStock,
} from '../types';

export const inventoryApi = {
    /**
     * Obtiene estadísticas generales del inventario
     */
    getStats: async (): Promise<InventoryStats> => {
        const response = await api.get<InventoryStats>('/api/inventory/stats');
        return response.data;
    },

    /**
     * Obtiene todos los productos con su stock
     */
    getAllProductsStock: async (): Promise<ProductStock[]> => {
        const response = await api.get<ProductStock[]>('/api/inventory/products');
        return response.data;
    },

    /**
     * Obtiene productos con stock bajo
     */
    getLowStock: async (): Promise<Product[]> => {
        const response = await api.get<Product[]>('/api/inventory/low-stock');
        return response.data;
    },

    /**
     * Obtiene productos sin stock
     */
    getOutOfStock: async (): Promise<Product[]> => {
        const response = await api.get<Product[]>('/api/inventory/out-of-stock');
        return response.data;
    },

    /**
     * Registra un movimiento de stock
     */
    createMovement: async (data: CreateStockMovementDTO): Promise<StockMovement> => {
        const response = await api.post<StockMovement>('/api/inventory/movement', data);
        return response.data;
    },

    /**
     * Obtiene el historial de movimientos de un producto
     */
    getProductHistory: async (productId: string): Promise<{
        product: { id: string; name: string; stock: number };
        movements: StockMovement[];
    }> => {
        const response = await api.get(`/api/inventory/product/${productId}/history`);
        return response.data;
    },

    /**
     * Valida disponibilidad de stock para múltiples productos
     */
    validateStock: async (items: { productId: string; quantity: number }[]): Promise<{
        available: boolean;
        insufficientProducts: { productId: string; name: string; requested: number; available: number }[];
    }> => {
        const response = await api.post('/api/inventory/validate-stock', items);
        return response.data;
    },
};

