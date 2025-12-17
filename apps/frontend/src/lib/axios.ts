import axios from 'axios';

/**
 * Detecta si la aplicación está corriendo dentro de Electron
 */
function isElectron(): boolean {
    return typeof window !== 'undefined' &&
        (window as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron === true;
}

/**
 * Obtiene la URL base del API según el entorno
 * - En Electron: siempre localhost:3000 (backend embebido)
 * - En Web: usa variable de entorno o el hostname actual
 */
function getApiBaseUrl(): string {
    // En Electron, obtener URL dinámica (puede ser localhost o remota si es cliente)
    if (isElectron()) {
        const electronApi = (window as any).electronAPI;
        return electronApi?.apiUrl || 'http://localhost:3000';
    }

    // En web, usar variable de entorno o hostname dinámico
    return import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
}

const API_URL = getApiBaseUrl();

export const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - añadir token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - manejar errores y refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no es un retry, y no es la petición de login
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    // No hay refresh token, redirigir a login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '#/login';
                    return Promise.reject(error);
                }

                // Intentar refrescar el token
                const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Guardar nuevos tokens
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Reintentar la petición original con el nuevo token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh token expirado o inválido
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '#/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
