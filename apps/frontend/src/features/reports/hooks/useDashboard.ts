/**
 * Hook para obtener datos del Dashboard
 * Incluye auto-refresh cada 30 segundos
 */
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';

/**
 * Hook para obtener el resumen del dashboard con auto-refresh
 */
export function useDashboard() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: () => reportsApi.getDashboardSummary(),
        refetchInterval: 30000, // Refrescar cada 30 segundos
        staleTime: 10000, // Considerar datos frescos por 10 segundos
    });
}
