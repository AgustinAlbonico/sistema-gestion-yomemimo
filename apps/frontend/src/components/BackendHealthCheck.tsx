import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Tipos para la respuesta del health check
interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    api: { status: string };
    database: { status: string };
  };
}

interface BackendHealthCheckProps {
  children: React.ReactNode;
}

/**
 * Detecta si la aplicación está corriendo dentro de Electron
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' &&
    (window as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron === true;
}

/**
 * Obtiene la URL base del API según el entorno
 */
function getApiBaseUrl(): string {
  if (isElectron()) {
    const electronApi = (window as { electronAPI?: { apiUrl?: string } }).electronAPI;
    return electronApi?.apiUrl || 'http://localhost:3000';
  }
  return import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
}

/**
 * Componente que verifica que el backend esté disponible antes de mostrar la aplicación.
 * Muestra una pantalla de carga animada mientras el backend está iniciando.
 */
export function BackendHealthCheck({ children }: BackendHealthCheckProps) {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const API_URL = getApiBaseUrl();

  // Intervalo entre cada intento de conexión (ms)
  const RETRY_INTERVAL = 1500;
  // Máximo número de intentos antes de mostrar error
  const MAX_RETRIES = 40; // ~60 segundos en total

  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.get<HealthCheckResponse>(`${API_URL}/api/health`, {
        timeout: 5000,
      });
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }, [API_URL]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const attemptConnection = async () => {
      const isHealthy = await checkBackendHealth();

      if (!isMounted) return;

      if (isHealthy) {
        setIsBackendReady(true);
        setErrorMessage(null);
      } else {
        setRetryCount((prev) => prev + 1);

        if (retryCount >= MAX_RETRIES) {
          setErrorMessage(
            'No se pudo conectar con el servidor. Por favor, verifica que el sistema esté correctamente instalado.'
          );
        } else {
          // Programar siguiente intento
          timeoutId = setTimeout(attemptConnection, RETRY_INTERVAL);
        }
      }
    };

    if (!isBackendReady) {
      attemptConnection();
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [checkBackendHealth, isBackendReady, retryCount]);

  // Si el backend está listo, mostrar la aplicación
  if (isBackendReady) {
    return <>{children}</>;
  }

  // Pantalla de carga mientras el backend inicia
  return (
    <div className="backend-loading-screen">
      <div className="backend-loading-content">
        {/* Logo o nombre del sistema */}
        <div className="backend-loading-logo">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="backend-loading-icon"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <h1 className="backend-loading-title">NexoPOS</h1>
        </div>

        {/* Mensaje de estado */}
        {errorMessage ? (
          <div className="backend-loading-error">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="backend-error-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="backend-error-message">{errorMessage}</p>
            <button
              className="backend-retry-button"
              onClick={() => {
                setRetryCount(0);
                setErrorMessage(null);
              }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="backend-loading-spinner-container">
            <div className="backend-loading-spinner"></div>
            <p className="backend-loading-message">Iniciando el sistema...</p>
            <p className="backend-loading-submessage">Por favor espera un momento</p>
          </div>
        )}

        {/* Indicador de intentos (solo visible si hay muchos) */}
        {!errorMessage && retryCount > 5 && (
          <p className="backend-loading-retry-count">
            Conectando al servidor... ({retryCount}/{MAX_RETRIES})
          </p>
        )}
      </div>

      <style>{`
        .backend-loading-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          z-index: 9999;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .backend-loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          text-align: center;
        }

        .backend-loading-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .backend-loading-icon {
          width: 64px;
          height: 64px;
          color: #3b82f6;
          animation: pulse-icon 2s ease-in-out infinite;
        }

        @keyframes pulse-icon {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }

        .backend-loading-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .backend-loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .backend-loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .backend-loading-message {
          font-size: 1.125rem;
          color: #e2e8f0;
          margin: 0;
          font-weight: 500;
        }

        .backend-loading-submessage {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0;
        }

        .backend-loading-retry-count {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
          padding-top: 1rem;
        }

        .backend-loading-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          max-width: 400px;
        }

        .backend-error-icon {
          width: 48px;
          height: 48px;
          color: #ef4444;
        }

        .backend-error-message {
          font-size: 0.875rem;
          color: #fca5a5;
          margin: 0;
          line-height: 1.5;
        }

        .backend-retry-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .backend-retry-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .backend-retry-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

export default BackendHealthCheck;
