/**
 * API client para cuentas corrientes
 * Funciones para comunicarse con el backend
 */
import { api } from '@/lib/axios';
import type {
    CustomerAccount,
    AccountStatement,
    AccountStats,
    OverdueAlert,
    PaginatedAccounts,
    CreateChargeDto,
    CreatePaymentDto,
    UpdateAccountDto,
    AccountFiltersDto,
    AccountMovement,
} from '../types';

export const customerAccountsApi = {
    /**
     * Lista todas las cuentas corrientes con filtros y paginación
     */
    getAll: async (params?: AccountFiltersDto): Promise<PaginatedAccounts> => {
        const response = await api.get<PaginatedAccounts>('/api/customer-accounts', {
            params,
        });
        return response.data;
    },

    /**
     * Obtiene estadísticas globales de cuentas corrientes
     */
    getStats: async (): Promise<AccountStats> => {
        const response = await api.get<AccountStats>('/api/customer-accounts/stats');
        return response.data;
    },

    /**
     * Obtiene lista de clientes deudores
     */
    getDebtors: async (): Promise<CustomerAccount[]> => {
        const response = await api.get<CustomerAccount[]>('/api/customer-accounts/debtors');
        return response.data;
    },

    /**
     * Obtiene alertas de deudores morosos
     */
    getOverdueAlerts: async (): Promise<OverdueAlert[]> => {
        const response = await api.get<OverdueAlert[]>(
            '/api/customer-accounts/overdue-alerts'
        );
        return response.data;
    },

    /**
     * Obtiene el estado de cuenta de un cliente
     */
    getAccountStatement: async (customerId: string): Promise<AccountStatement> => {
        const response = await api.get<AccountStatement>(
            `/api/customer-accounts/${customerId}`
        );
        return response.data;
    },

    /**
     * Crea un cargo en la cuenta corriente (desde venta)
     */
    createCharge: async (
        customerId: string,
        data: CreateChargeDto
    ): Promise<AccountMovement> => {
        const response = await api.post<AccountMovement>(
            `/api/customer-accounts/${customerId}/charges`,
            data
        );
        return response.data;
    },

    /**
     * Registra un pago del cliente
     */
    createPayment: async (
        customerId: string,
        data: CreatePaymentDto
    ): Promise<AccountMovement> => {
        const response = await api.post<AccountMovement>(
            `/api/customer-accounts/${customerId}/payments`,
            data
        );
        return response.data;
    },

    /**
     * Actualiza una cuenta corriente
     */
    updateAccount: async (
        customerId: string,
        data: UpdateAccountDto
    ): Promise<CustomerAccount> => {
        const response = await api.patch<CustomerAccount>(
            `/api/customer-accounts/${customerId}`,
            data
        );
        return response.data;
    },

    /**
     * Suspende la cuenta de un cliente
     */
    suspendAccount: async (customerId: string): Promise<CustomerAccount> => {
        const response = await api.post<CustomerAccount>(
            `/api/customer-accounts/${customerId}/suspend`
        );
        return response.data;
    },

    /**
     * Reactiva la cuenta de un cliente
     */
    activateAccount: async (customerId: string): Promise<CustomerAccount> => {
        const response = await api.post<CustomerAccount>(
            `/api/customer-accounts/${customerId}/activate`
        );
        return response.data;
    },
};
