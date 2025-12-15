import { api } from '@/lib/axios';
import type {
    CashRegister,
    OpenCashRegisterDto,
    CloseCashRegisterDto,
    CreateCashMovementDto,
    CashStats,
    SuggestedInitialAmount,
    CashFlowReportFilters,
    CashFlowReport,
    CashStatus,
    CashHistoryFilters,
    PaginatedResponse,
} from '../types';


const BASE_URL = '/api/cash-register';

export const cashRegisterApi = {
    // ===== Sprint 1: Saldo Sugerido =====

    /**
     * Obtener saldo inicial sugerido (del día anterior)
     */
    async getSuggestedInitial(): Promise<SuggestedInitialAmount> {
        const response = await api.get(`${BASE_URL}/suggested-initial`);
        return response.data;
    },

    /**
     * Abrir una nueva caja
     */
    async open(data: OpenCashRegisterDto): Promise<CashRegister> {
        const response = await api.post(`${BASE_URL}/open`, data);
        return response.data;
    },

    /**
     * Cerrar la caja abierta
     */
    async close(data: CloseCashRegisterDto): Promise<CashRegister> {
        const response = await api.post(`${BASE_URL}/close`, data);
        return response.data;
    },

    /**
     * Reabrir una caja cerrada del día actual
     */
    async reopen(cashRegisterId: string): Promise<CashRegister> {
        const response = await api.post(`${BASE_URL}/${cashRegisterId}/reopen`);
        return response.data;
    },

    /**
     * Obtener la caja abierta actual
     */
    async getCurrent(): Promise<CashRegister | null> {
        const response = await api.get(`${BASE_URL}/current`);
        return response.data;
    },

    /**
     * Crear un movimiento manual
     */
    async createMovement(data: CreateCashMovementDto): Promise<void> {
        await api.post(`${BASE_URL}/movements`, data);
    },

    // ===== Sprint 1: Reportes por Rango =====

    /**
     * Obtener reporte de flujo de caja
     */
    async getCashFlowReport(filters: CashFlowReportFilters): Promise<CashFlowReport> {
        const response = await api.get(`${BASE_URL}/reports/cash-flow`, { params: filters });
        return response.data;
    },

    /**
     * Obtener historial de cajas con paginación
     */
    async getHistory(filters?: CashHistoryFilters): Promise<PaginatedResponse<CashRegister>> {
        const response = await api.get(`${BASE_URL}/history`, { params: filters });
        return response.data;
    },

    /**
     * Obtener estadísticas de cajas
     */
    async getStats(params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<CashStats> {
        const response = await api.get(`${BASE_URL}/stats`, { params });
        return response.data;
    },

    /**
     * Obtener una caja por ID
     */
    async getById(id: string): Promise<CashRegister> {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Obtener estado de la caja (si está abierta y si es del día anterior)
     * Útil para detectar cajas sin cerrar del día anterior
     */
    async getStatus(): Promise<CashStatus> {
        const response = await api.get(`${BASE_URL}/status`);
        return response.data;
    },
};

