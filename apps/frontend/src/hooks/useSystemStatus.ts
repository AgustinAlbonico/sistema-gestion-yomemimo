import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface SystemStatus {
    sistemaHabilitado: boolean;
}

/**
 * Hook para verificar si el sistema está habilitado
 * Se usa para bloquear el acceso si el sistema fue deshabilitado remotamente
 */
export function useSystemStatus() {
    const query = useQuery({
        queryKey: ['system-status'],
        queryFn: async (): Promise<SystemStatus> => {
            const response = await api.get('/api/configuration');
            return {
                sistemaHabilitado: response.data.sistemaHabilitado ?? true,
            };
        },
        staleTime: 60 * 1000, // Verificar cada 1 minuto
        refetchInterval: 60 * 1000, // Re-verificar automáticamente cada minuto
        retry: false, // No reintentar si falla (podría ser problema de red)
    });

    return {
        isEnabled: query.data?.sistemaHabilitado ?? true,
        message: 'Sistema deshabilitado. Contacte al proveedor.',
        isLoading: query.isLoading,
        isError: query.isError,
    };
}
