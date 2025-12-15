import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cashRegisterApi } from '../api';
import type {
    OpenCashRegisterDto,
    CloseCashRegisterDto,
    CreateCashMovementDto,
    CashFlowReportFilters,
    CashHistoryFilters,
} from '../types';

const QUERY_KEYS = {
    current: ['cash-register', 'current'] as const,
    status: ['cash-register', 'status'] as const,
    suggestedInitial: ['cash-register', 'suggested-initial'] as const,
    history: (filters?: CashHistoryFilters) =>
        ['cash-register', 'history', filters] as const,
    stats: (params?: { startDate?: string; endDate?: string }) =>
        ['cash-register', 'stats', params] as const,
    detail: (id: string) => ['cash-register', 'detail', id] as const,
    cashFlowReport: (filters: CashFlowReportFilters) =>
        ['cash-register', 'cash-flow-report', filters] as const,
};


// ===== Sprint 1: Saldo Sugerido =====

/**
 * Hook para obtener saldo inicial sugerido
 */
export function useSuggestedInitialAmount() {
    return useQuery({
        queryKey: QUERY_KEYS.suggestedInitial,
        queryFn: cashRegisterApi.getSuggestedInitial,
    });
}

/**
 * Hook para obtener la caja abierta actual
 */
export function useOpenCashRegister() {
    return useQuery({
        queryKey: QUERY_KEYS.current,
        queryFn: cashRegisterApi.getCurrent,
        refetchOnMount: 'always', // Siempre refrescar al montar el componente
        refetchOnWindowFocus: true, // Refrescar al volver a la ventana
        staleTime: 0, // Los datos siempre se consideran "stale" para forzar refetch
    });
}

/**
 * Hook para abrir una caja
 */
export function useOpenCashRegisterMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OpenCashRegisterDto) => cashRegisterApi.open(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current });
            queryClient.invalidateQueries({ queryKey: ['cash-register', 'history'] });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suggestedInitial });
            toast.success('Caja abierta exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al abrir la caja');
        },
    });
}

/**
 * Hook para cerrar una caja
 */
export function useCloseCashRegisterMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CloseCashRegisterDto) => cashRegisterApi.close(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current });
            queryClient.invalidateQueries({ queryKey: ['cash-register', 'history'] });
            queryClient.invalidateQueries({ queryKey: ['cash-register', 'stats'] });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suggestedInitial });
            toast.success('Caja cerrada exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al cerrar la caja');
        },
    });
}

/**
 * Hook para reabrir una caja cerrada del día actual
 */
export function useReopenCashRegisterMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cashRegisterId: string) => cashRegisterApi.reopen(cashRegisterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current });
            queryClient.invalidateQueries({ queryKey: ['cash-register', 'history'] });
            toast.success('Caja reabierta exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al reabrir la caja');
        },
    });
}

/**
 * Hook para crear un movimiento manual
 */
export function useCreateCashMovementMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCashMovementDto) => cashRegisterApi.createMovement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current });
            toast.success('Movimiento registrado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al registrar el movimiento');
        },
    });
}

/**
 * Hook para obtener el historial de cajas con paginación
 */
export function useCashHistory(filters?: CashHistoryFilters) {
    return useQuery({
        queryKey: QUERY_KEYS.history(filters),
        queryFn: () => cashRegisterApi.getHistory(filters),
    });
}

/**
 * Hook para obtener estadísticas de cajas
 */
export function useCashStats(params?: { startDate?: string; endDate?: string }) {
    return useQuery({
        queryKey: QUERY_KEYS.stats(params),
        queryFn: () => cashRegisterApi.getStats(params),
    });
}

/**
 * Hook para obtener una caja por ID
 */
export function useCashRegisterDetail(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.detail(id),
        queryFn: () => cashRegisterApi.getById(id),
        enabled: !!id,
    });
}

// ===== Sprint 1: Reporte de Flujo de Caja =====

/**
 * Hook para obtener reporte de flujo de caja
 */
export function useCashFlowReport(filters: CashFlowReportFilters, enabled = true) {
    return useQuery({
        queryKey: QUERY_KEYS.cashFlowReport(filters),
        queryFn: () => cashRegisterApi.getCashFlowReport(filters),
        enabled: enabled && !!filters.startDate && !!filters.endDate,
    });
}

/**
 * Hook para obtener el estado de la caja
 * Detecta si hay caja abierta y si es del día anterior (sin cerrar)
 */
export function useCashStatus() {
    return useQuery({
        queryKey: QUERY_KEYS.status,
        queryFn: cashRegisterApi.getStatus,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 0, // Siempre actualizado para detectar cambios
    });
}

