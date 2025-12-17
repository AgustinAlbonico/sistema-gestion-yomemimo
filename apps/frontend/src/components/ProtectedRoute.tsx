import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useSystemStatus } from '../hooks/useSystemStatus';
import { SystemBlockedScreen } from './SystemBlockedScreen';

interface ProtectedRouteProps {
    readonly children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { isEnabled, isLoading } = useSystemStatus();

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Mientras carga, mostrar nada (la app ya tiene su loading)
    if (isLoading) {
        return null;
    }

    // Si el sistema está deshabilitado, mostrar pantalla de bloqueo
    if (!isEnabled) {
        return <SystemBlockedScreen />;
    }

    return <>{children}</>;
}

