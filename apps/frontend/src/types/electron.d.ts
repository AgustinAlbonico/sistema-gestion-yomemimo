/**
 * Tipos TypeScript para la API de Electron expuesta al frontend
 * Este archivo extiende el objeto Window con la API de electronAPI
 */

export interface ElectronAPI {
    // Información de la aplicación
    getAppVersion: () => Promise<string>;

    // Estado del backend
    isBackendReady: () => Promise<boolean>;

    // Información del sistema
    getSystemInfo: () => Promise<{
        platform: string;
        arch: string;
        version: string;
        isDev: boolean;
    }>;

    // Control de ventana
    toggleFullscreen: () => void;
    minimizeWindow: () => void;
    closeWindow: () => void;

    // Plataforma actual
    platform: string;

    // Indicador de que estamos en Electron
    isElectron: boolean;
}

// Extender la interfaz Window global
declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
