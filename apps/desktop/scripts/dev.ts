/**
 * Script de desarrollo para Electron
 * Ejecuta el frontend (Vite) y Electron en paralelo con hot-reload
 */

import { spawn, ChildProcess, execSync } from 'node:child_process';
import * as path from 'node:path';

// Puertos utilizados por la aplicación
const FRONTEND_PORT = 5173;
const BACKEND_PORT = 3000;

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

function log(prefix: string, color: string, message: string): void {
    console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

/**
 * Mata cualquier proceso que esté escuchando en un puerto específico (Windows)
 */
function killProcessOnPort(port: number): void {
    try {
        // Buscar el PID del proceso que usa el puerto
        const result = execSync(
            `netstat -ano | findstr :${port} | findstr LISTENING`,
            { encoding: 'utf-8', timeout: 5000 }
        );

        // Parsear el PID de la salida
        const lines = result.trim().split('\n');
        const pids: string[] = [];

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts.at(-1);
            if (pid && /^\d+$/.test(pid) && pid !== '0' && !pids.includes(pid)) {
                pids.push(pid);
            }
        }

        // Matar cada proceso encontrado
        for (const pid of pids) {
            try {
                log('Dev', colors.yellow, `Matando proceso PID ${pid} en puerto ${port}`);
                execSync(`taskkill /F /PID ${pid} /T`, { timeout: 5000 });
            } catch {
                // Ignorar errores si el proceso ya terminó
            }
        }

        if (pids.length > 0) {
            log('Dev', colors.green, `Puerto ${port} liberado`);
        }
    } catch {
        // No hay proceso en ese puerto, está bien
        log('Dev', colors.green, `Puerto ${port} ya está libre`);
    }
}

/**
 * Limpia todos los puertos necesarios antes de iniciar
 */
function cleanupPorts(): void {
    log('Dev', colors.yellow, 'Verificando y liberando puertos...');

    if (process.platform === 'win32') {
        killProcessOnPort(FRONTEND_PORT);
        killProcessOnPort(BACKEND_PORT);
    } else {
        // En Unix/Mac se podría usar lsof y kill, pero por ahora solo Windows
        log('Dev', colors.yellow, 'Limpieza de puertos solo implementada para Windows');
    }
}

// Procesos hijos
let frontendProcess: ChildProcess | null = null;
let electronProcess: ChildProcess | null = null;

// Directorio raíz del proyecto
const rootDir = path.join(__dirname, '../../..');

/**
 * Inicia el servidor de desarrollo del frontend (Vite)
 */
function startFrontend(): Promise<void> {
    return new Promise((resolve) => {
        log('Frontend', colors.cyan, 'Iniciando Vite...');

        frontendProcess = spawn('npm', ['run', 'dev'], {
            cwd: path.join(rootDir, 'apps/frontend'),
            shell: true,
            stdio: 'pipe',
        });

        let resolved = false;
        const resolveOnce = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };

        frontendProcess.stdout?.on('data', (data: Buffer) => {
            const output = data.toString();
            process.stdout.write(`${colors.cyan}[Frontend]${colors.reset} ${output}`);

            // Detectar cuando Vite está listo
            if (output.includes('Local:') || output.includes('ready in') || output.includes('localhost:5173')) {
                log('Frontend', colors.green, '¡Vite listo!');
                // Pequeña pausa adicional para asegurar que el servidor esté completamente listo
                setTimeout(resolveOnce, 1000);
            }
        });

        frontendProcess.stderr?.on('data', (data: Buffer) => {
            process.stderr.write(`${colors.red}[Frontend Error]${colors.reset} ${data.toString()}`);
        });

        frontendProcess.on('error', (error) => {
            log('Frontend', colors.red, `Error: ${error.message}`);
        });

        // Timeout de seguridad aumentado
        setTimeout(resolveOnce, 15000);
    });
}

/**
 * Inicia Electron
 */
function startElectron(): void {
    log('Electron', colors.yellow, 'Iniciando Electron...');

    // Primero compilar TypeScript
    const tscProcess = spawn('npx', ['tsc', '-p', 'tsconfig.json'], {
        cwd: path.join(rootDir, 'apps/desktop'),
        shell: true,
        stdio: 'inherit',
    });

    tscProcess.on('close', (code) => {
        if (code !== 0) {
            log('Electron', colors.red, 'Error al compilar TypeScript');
            return;
        }

        log('Electron', colors.green, 'TypeScript compilado');

        // Iniciar Electron
        electronProcess = spawn('npx', ['electron', '.'], {
            cwd: path.join(rootDir, 'apps/desktop'),
            shell: true,
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV: 'development',
            },
        });

        electronProcess.on('close', (exitCode) => {
            log('Electron', colors.yellow, `Proceso terminado (código: ${exitCode})`);
            cleanup();
        });
    });
}

/**
 * Limpia todos los procesos al cerrar.
 * En Windows usamos taskkill /T para matar el árbol completo de procesos.
 */
function cleanup(): void {
    log('Dev', colors.yellow, 'Cerrando procesos...');

    // En Windows, kill() no mata los procesos hijos, necesitamos taskkill /T
    if (process.platform === 'win32') {
        if (frontendProcess?.pid) {
            spawn('taskkill', ['/pid', String(frontendProcess.pid), '/f', '/t'], {
                shell: true,
                stdio: 'ignore'
            });
        }
        if (electronProcess?.pid) {
            spawn('taskkill', ['/pid', String(electronProcess.pid), '/f', '/t'], {
                shell: true,
                stdio: 'ignore'
            });
        }
    } else {
        frontendProcess?.kill('SIGTERM');
        electronProcess?.kill('SIGTERM');
    }

    frontendProcess = null;
    electronProcess = null;

    // Pequeña pausa para que los procesos terminen
    setTimeout(() => process.exit(0), 500);
}

// Manejar señales de cierre
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Función principal
async function main(): Promise<void> {
    console.log('\n');
    log('Dev', colors.green, '=== NexoPOS Desktop - Modo Desarrollo ===');
    console.log('\n');

    try {
        // 0. Limpiar puertos ocupados
        cleanupPorts();

        // 1. Iniciar frontend
        await startFrontend();

        // 2. Pequeña pausa
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Iniciar Electron
        startElectron();

    } catch (error) {
        log('Dev', colors.red, `Error: ${error}`);
        cleanup();
    }
}

main().catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
});
