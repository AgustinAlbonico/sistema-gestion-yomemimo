import { BrowserWindow, ipcMain, app } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Client } from 'pg';

/** Detectar si estamos en modo desarrollo (consistente con main.ts) */
const isDev = !app.isPackaged;

let setupWindow: BrowserWindow | null = null;

export function createSetupWizard(onSuccess: () => void) {
    if (setupWindow) {
        setupWindow.focus();
        return;
    }

    setupWindow = new BrowserWindow({
        width: 500,
        height: 700,
        resizable: false,
        title: 'Configuración inicial - NexoPOS',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Simplificado para este wizard local
        },
        autoHideMenuBar: true,
    });

    // Cargar el HTML del wizard
    // En desarrollo: apuntar al archivo fuente (ya que no se copia a dist)
    // En producción: apuntar a resources/setup
    const setupPath = isDev
        ? path.join(__dirname, '../../electron/setup/index.html')
        : path.join(process.resourcesPath, 'setup/index.html');

    console.log(`[Setup] isDev: ${isDev}, setupPath: ${setupPath}`);

    setupWindow.loadFile(setupPath);

    setupWindow.on('closed', () => {
        setupWindow = null;
    });

    // Manejar intento de conexión y guardado
    ipcMain.handle('setup-database', async (_, config) => {
        const isClientMode = config.mode === 'client';

        if (isClientMode) {
            // --- MODO CLIENTE ---
            const backendUrl = `http://${config.serverIp}:${config.backendPort || 3000}`;
            console.log(`[Setup] Probando conexión a backend: ${backendUrl}`);

            try {
                // Probar conexión HTTP al backend con timeout de 10 segundos
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(`${backendUrl}/api/health`, {
                    signal: controller.signal,
                    method: 'GET',
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`El servidor respondió con estado HTTP ${response.status}`);
                }

                console.log('[Setup] Conexión exitosa a backend remoto');

                // Guardar configuración CLIENTE en .env
                const envContent = `
# Configuración GENERADA por Setup Wizard (MODO CLIENTE)
MODE=CLIENT
BACKEND_URL=${backendUrl}
FRONTEND_PORT=5173
NODE_ENV=production
      `.trim();

                // Ruta del archivo .env
                // En desarrollo: carpeta desktop
                // En producción: junto al ejecutable (consistente con main.ts)
                const envPath = isDev
                    ? path.join(__dirname, '../../.env')
                    : path.join(path.dirname(app.getPath('exe')), '.env');

                console.log(`[Setup] Guardando .env CLIENTE en: ${envPath}`);
                await fs.writeFile(envPath, envContent);

                return { success: true };

            } catch (error: any) {
                console.error('[Setup] Error conexión cliente:', error);

                // Mensajes de error más descriptivos
                let errorMessage = 'Error de conexión desconocido';

                if (error.name === 'AbortError' || error.message?.includes('abort')) {
                    errorMessage = `Tiempo de espera agotado. Verificá que:\n• La PC servidor esté encendida y con la app abierta\n• La IP "${config.serverIp}" sea correcta\n• El puerto 3000 esté permitido en el firewall del servidor`;
                } else if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
                    errorMessage = `Conexión rechazada. El backend no está corriendo en ${config.serverIp}:3000\nVerificá que la app NexoPOS esté abierta en la PC servidor`;
                } else if (error.cause?.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
                    errorMessage = `No se encontró el servidor. Verificá la IP: ${config.serverIp}`;
                } else if (error.cause?.code === 'ENETUNREACH' || error.message?.includes('ENETUNREACH')) {
                    errorMessage = `Red inalcanzable. Las PCs no están en la misma red local`;
                } else if (error.cause?.code === 'ETIMEDOUT' || error.message?.includes('ETIMEDOUT')) {
                    errorMessage = `Tiempo agotado al conectar. Verificá el firewall del servidor (puerto 3000)`;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                return { success: false, error: errorMessage };
            }

        } else {
            // --- MODO SERVIDOR (PostgreSQL) ---
            const client = new Client({
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.username,
                password: config.password,
                connectionTimeoutMillis: 5000,
            });

            try {
                await client.connect();
                await client.query('SELECT 1'); // Test query
                await client.end();

                // Si conecta, guardar en .env
                const envContent = `
# Configuración GENERADA por Setup Wizard (MODO SERVIDOR)
MODE=SERVER
DATABASE_HOST=${config.host}
DATABASE_PORT=${config.port}
DATABASE_NAME=${config.database}
DATABASE_USER=${config.username}
DATABASE_PASSWORD=${config.password}
BACKEND_PORT=3000
FRONTEND_PORT=5173
NODE_ENV=production

# Seguridad JWT
JWT_SECRET=${config.jwtSecret || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}
JWT_EXPIRATION=36500d
      `.trim();

                // Ruta del archivo .env
                // En desarrollo: carpeta desktop
                // En producción: junto al ejecutable (consistente con main.ts)
                const envPath = isDev
                    ? path.join(__dirname, '../../.env')
                    : path.join(path.dirname(app.getPath('exe')), '.env');

                console.log(`[Setup] Guardando .env SERVIDOR en: ${envPath}`);
                await fs.writeFile(envPath, envContent);

                return { success: true };
            } catch (error: any) {
                if (client) {
                    try { await client.end(); } catch { }
                }
                console.error('Error de conexión:', error);
                return { success: false, error: error.message || 'Error de conexión a Base de Datos' };
            }
        }
    });

    // Manejar finalización
    ipcMain.once('setup-complete', () => {
        if (setupWindow) {
            setupWindow.close();
        }
        // Eliminar handlers para no duplicar si se reabre
        ipcMain.removeHandler('setup-database');
        onSuccess();
    });
}
