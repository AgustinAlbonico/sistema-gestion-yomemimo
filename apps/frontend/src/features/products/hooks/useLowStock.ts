/**
 * Hook para obtener productos con stock bajo
 * Se usa para alertas en Sidebar y Dashboard
 */
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';

export function useLowStockProducts() {
    return useQuery({
        queryKey: ['inventory', 'low-stock'],
        queryFn: () => inventoryApi.getLowStock(),
        staleTime: 2 * 60 * 1000, // 2 minutos - refrescar frecuentemente
        refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos en background
    });
}

export function useLowStockCount() {
    const { data, isLoading } = useLowStockProducts();
    return {
        count: data?.length ?? 0,
        isLoading,
    };
}

