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
