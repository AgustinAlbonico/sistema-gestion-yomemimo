/**
 * React Query hooks para cuentas corrientes
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customerAccountsApi } from '../api/customer-accounts.api';
import type {
    AccountFiltersDto,
    CreateChargeDto,
    CreatePaymentDto,
    UpdateAccountDto,
    ApplySurchargeDto,
} from '../types';

// Query keys
export const customerAccountsKeys = {
    all: ['customer-accounts'] as const,
    lists: () => [...customerAccountsKeys.all, 'list'] as const,
    list: (filters?: AccountFiltersDto) =>
        [...customerAccountsKeys.lists(), filters] as const,
    stats: () => [...customerAccountsKeys.all, 'stats'] as const,
    debtors: () => [...customerAccountsKeys.all, 'debtors'] as const,
    overdueAlerts: () => [...customerAccountsKeys.all, 'overdue-alerts'] as const,
    statement: (customerId: string) =>
        [...customerAccountsKeys.all, 'statement', customerId] as const,
    pendingTransactions: (customerId: string) =>
        [...customerAccountsKeys.all, 'pending-transactions', customerId] as const,
};

/**
 * Hook para obtener lista de cuentas con filtros
 */
export function useCustomerAccounts(filters?: AccountFiltersDto) {
    return useQuery({
        queryKey: customerAccountsKeys.list(filters),
        queryFn: () => customerAccountsApi.getAll(filters),
    });
}

/**
 * Hook para obtener estadísticas
 */
export function useAccountsStats() {
    return useQuery({
        queryKey: customerAccountsKeys.stats(),
        queryFn: () => customerAccountsApi.getStats(),
    });
}

/**
 * Hook para obtener lista de deudores
 */
export function useDebtors() {
    return useQuery({
        queryKey: customerAccountsKeys.debtors(),
        queryFn: () => customerAccountsApi.getDebtors(),
    });
}

/**
 * Hook para obtener alertas de morosos
 */
export function useOverdueAlerts() {
    return useQuery({
        queryKey: customerAccountsKeys.overdueAlerts(),
        queryFn: () => customerAccountsApi.getOverdueAlerts(),
    });
}

/**
 * Hook para obtener estado de cuenta de un cliente
 */
export function useAccountStatement(customerId: string | undefined) {
    return useQuery({
        queryKey: customerAccountsKeys.statement(customerId!),
        queryFn: () => customerAccountsApi.getAccountStatement(customerId!),
        enabled: !!customerId,
    });
}

/**
 * Hook para crear cargo
 */
export function useCreateCharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            data,
        }: {
            customerId: string;
            data: CreateChargeDto;
        }) => customerAccountsApi.createCharge(customerId, data),
        onSuccess: (_, variables) => {
            toast.success('Cargo creado exitosamente');
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.statement(variables.customerId),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.stats(),
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear cargo');
        },
    });
}

/**
 * Hook para registrar pago
 */
export function useCreatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            data,
        }: {
            customerId: string;
            data: CreatePaymentDto;
        }) => customerAccountsApi.createPayment(customerId, data),
        onSuccess: (_, variables) => {
            toast.success('Pago registrado exitosamente');
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.statement(variables.customerId),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.stats(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.debtors(),
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al registrar pago');
        },
    });
}

/**
 * Hook para actualizar cuenta
 */
export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            data,
        }: {
            customerId: string;
            data: UpdateAccountDto;
        }) => customerAccountsApi.updateAccount(customerId, data),
        onSuccess: (_, variables) => {
            toast.success('Cuenta actualizada exitosamente');
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.statement(variables.customerId),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.lists(),
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar cuenta');
        },
    });
}

/**
 * Hook para suspender cuenta
 */
export function useSuspendAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customerId: string) =>
            customerAccountsApi.suspendAccount(customerId),
        onSuccess: (_, customerId) => {
            toast.success('Cuenta suspendida');
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.statement(customerId),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.stats(),
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al suspender cuenta');
        },
    });
}

/**
 * Hook para reactivar cuenta
 */
export function useActivateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customerId: string) =>
            customerAccountsApi.activateAccount(customerId),
        onSuccess: (_, customerId) => {
            toast.success('Cuenta reactivada');
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.statement(customerId),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.stats(),
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al reactivar cuenta');
        },
    });
}

/**
 * Hook para obtener transacciones pendientes de un cliente
 */
export function usePendingTransactions(customerId: string | undefined) {
    return useQuery({
        queryKey: customerAccountsKeys.pendingTransactions(customerId!),
        queryFn: () => customerAccountsApi.getPendingTransactions(customerId!),
        enabled: !!customerId,
    });
}

/**
 * Hook para aplicar recargo/interés a una cuenta
 */
export function useApplySurcharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            data,
        }: {
            customerId: string;
            data: ApplySurchargeDto;
        }) => customerAccountsApi.applySurcharge(customerId, data),
        onSuccess: (_, variables) => {
            toast.success('Recargo aplicado exitosamente');
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.statement(variables.customerId),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.stats(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.debtors(),
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al aplicar recargo');
        },
    });
}

/**
 * Hook para sincronizar cargos faltantes de ventas
 */
export function useSyncMissingCharges() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customerId: string) =>
            customerAccountsApi.syncMissingCharges(customerId),
        onSuccess: (result, customerId) => {
            // Solo mostrar notificación si realmente se sincronizaron cargos
            // (ya que la sincronización es automática, no queremos molestar al usuario si no hay nada que sincronizar)
            if (result.chargesCreated > 0) {
                toast.success(
                    `Se sincronizaron ${result.chargesCreated} cargo(s) por un total de $${result.totalAmount.toFixed(2)}`
                );
            }
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.statement(customerId),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.stats(),
            });
            queryClient.invalidateQueries({
                queryKey: customerAccountsKeys.debtors(),
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al sincronizar cargos');
        },
    });
}


