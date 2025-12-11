import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    sub: string;
    username: string;
    exp: number;
    iat: number;
}

/**
 * Hook que renueva automáticamente el refresh token antes de que expire
 * para mantener la sesión activa indefinidamente hasta que el usuario
 * cierre sesión manualmente.
 */
export const useTokenRefresh = () => {
    const { refreshToken, setAuth, logout, isAuthenticated } = useAuthStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !refreshToken) {
            // Limpiar el intervalo si no hay sesión activa
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const checkAndRefreshToken = async () => {
            try {
                if (!refreshToken) return;

                // Decodificar el refresh token para obtener su fecha de expiración
                const decoded = jwtDecode<JwtPayload>(refreshToken);
                const expirationTime = decoded.exp * 1000; // Convertir a milisegundos
                const currentTime = Date.now();
                const timeUntilExpiration = expirationTime - currentTime;

                // Si faltan menos de 7 días (604800000 ms) para que expire, renovarlo
                const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

                if (timeUntilExpiration < sevenDaysInMs && timeUntilExpiration > 0) {
                    console.log('Renovando refresh token automáticamente...');

                    // Renovar el token
                    const response = await authService.refreshToken(refreshToken);
                    setAuth(response);

                    console.log('Refresh token renovado exitosamente');
                }
            } catch (error) {
                console.error('Error al renovar el refresh token:', error);
                // Si hay un error al renovar, cerrar sesión
                logout();
            }
        };

        // Verificar inmediatamente al montar
        checkAndRefreshToken();

        // Verificar cada 24 horas
        const oneDayInMs = 24 * 60 * 60 * 1000;
        intervalRef.current = setInterval(checkAndRefreshToken, oneDayInMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isAuthenticated, refreshToken, setAuth, logout]);
};
