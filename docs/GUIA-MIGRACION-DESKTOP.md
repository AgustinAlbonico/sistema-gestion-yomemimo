# 🖥️ Guía Completa: Migración de NexoPOS a Aplicación de Escritorio

> **Nivel**: Principiante  
> **Tiempo estimado**: 3-4 horas siguiendo la guía  
> **Resultado**: Un instalador `.exe` de NexoPOS que funciona sin navegador

---

## 📋 Índice

1. [¿Qué es Electron y por qué lo usamos?](#1-qué-es-electron-y-por-qué-lo-usamos)
2. [Requisitos previos](#2-requisitos-previos)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Paso 1: Crear la app desktop](#paso-1-crear-la-app-desktop)
5. [Paso 2: Configurar el proceso principal](#paso-2-configurar-el-proceso-principal)
6. [Paso 3: Adaptar el backend](#paso-3-adaptar-el-backend)
7. [Paso 4: Adaptar el frontend](#paso-4-adaptar-el-frontend)
8. [Paso 5: Configurar empaquetado](#paso-5-configurar-empaquetado)
9. [Paso 6: Configurar auto-actualización](#paso-6-configurar-auto-actualización)
10. [Paso 7: Generar el instalador](#paso-7-generar-el-instalador)
11. [Paso 8: Distribuir actualizaciones](#paso-8-distribuir-actualizaciones)
12. [Solución de problemas comunes](#solución-de-problemas-comunes)

---

## 1. ¿Qué es Electron y por qué lo usamos?

**Electron** es un framework que permite crear aplicaciones de escritorio usando tecnologías web (HTML, CSS, JavaScript). Lo usan apps famosas como:

- Visual Studio Code
- Discord
- Slack
- Notion

### ¿Por qué es ideal para NexoPOS?

| Ventaja | Explicación |
|---------|-------------|
| **Reutilizamos el código** | Tu frontend React funciona casi sin cambios |
| **Backend embebido** | NestJS corre dentro de la app, no necesita servidor externo |
| **Multiplataforma** | Un mismo código para Windows, Mac y Linux |
| **Auto-actualización** | Los clientes reciben updates automáticamente |

### Arquitectura simplificada

```
┌─────────────────────────────────────────────────────┐
│                    NexoPOS.exe                       │
│  ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  Ventana de la  │    │   Backend NestJS        │ │
│  │  aplicación     │◄──►│   (corre en segundo     │ │
│  │  (tu React app) │    │    plano)               │ │
│  └─────────────────┘    └───────────┬─────────────┘ │
│                                     │               │
│                         ┌───────────▼─────────────┐ │
│                         │   PostgreSQL (local)    │ │
│                         └─────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 2. Requisitos Previos

Antes de empezar, asegurate de tener instalado:

### En tu máquina de desarrollo

| Requisito | Versión Mínima | Cómo verificar |
|-----------|----------------|----------------|
| Node.js | 20 LTS | `node --version` |
| pnpm | 8.0+ | `pnpm --version` |
| Git | Cualquiera | `git --version` |
| Visual Studio Build Tools | 2019+ | (solo para compilar en Windows) |

### Instalar Visual Studio Build Tools (si no lo tenés)

Esto es necesario para compilar módulos nativos de Node.js:

```powershell
# Opción 1: Usando winget (Windows 11)
winget install Microsoft.VisualStudio.2022.BuildTools

# Opción 2: Descargar manualmente
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Seleccionar "Desarrollo para escritorio con C++"
```

---

## 3. Estructura del Proyecto

Después de la migración, tu proyecto tendrá esta estructura:

```
sistema-gestion/
├── apps/
│   ├── backend/                 # Sin cambios mayores
│   ├── frontend/                # Sin cambios mayores
│   └── desktop/                 # ⭐ NUEVO - Wrapper Electron
│       ├── electron/
│       │   ├── main.ts          # Proceso principal
│       │   ├── preload.ts       # Bridge de seguridad
│       │   └── updater.ts       # Auto-actualización
│       ├── build/
│       │   └── icon.ico         # Icono de la app
│       ├── scripts/
│       │   └── dev.ts           # Script de desarrollo
│       ├── package.json
│       ├── tsconfig.json
│       └── electron-builder.yml # Configuración del instalador
├── package.json                 # Agregar scripts nuevos
└── ...
```

---

## Paso 1: Crear la App Desktop

### 1.1 Crear el directorio

```powershell
# Desde la raíz del proyecto
cd c:\Users\AgustinNotebook\Desktop\Proyectos\sistema-gestion

# Crear estructura de carpetas
mkdir apps\desktop
mkdir apps\desktop\electron
mkdir apps\desktop\build
mkdir apps\desktop\scripts
```

### 1.2 Crear el package.json

Crear el archivo `apps/desktop/package.json`:

```json
{
  "name": "@sistema/desktop",
  "version": "1.0.0",
  "description": "NexoPOS - Aplicación de Escritorio",
  "main": "dist/electron/main.js",
  "author": "Tu Nombre <tu@email.com>",
  "license": "UNLICENSED",
  "scripts": {
    "dev": "ts-node scripts/dev.ts",
    "build": "pnpm build:frontend && pnpm build:backend && pnpm build:electron && pnpm package",
    "build:frontend": "pnpm --filter @sistema/frontend build",
    "build:backend": "pnpm --filter @sistema/backend build",
    "build:electron": "tsc -p tsconfig.json",
    "package": "electron-builder --win --config electron-builder.yml",
    "package:dir": "electron-builder --win --dir --config electron-builder.yml"
  },
  "dependencies": {
    "electron-updater": "^6.1.7"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "electron": "^28.1.0",
    "electron-builder": "^24.9.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0"
  }
}
```

### 1.3 Crear el tsconfig.json

Crear el archivo `apps/desktop/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "moduleResolution": "node"
  },
  "include": ["electron/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 Instalar dependencias

```powershell
cd apps\desktop
pnpm install
```

---

## Paso 2: Configurar el Proceso Principal

El "proceso principal" es el corazón de Electron. Maneja la ventana y ejecuta el backend.

### 2.1 Crear main.ts

Crear el archivo `apps/desktop/electron/main.ts`:

```typescript
import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

// Variables globales
let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

// ============================================
// FUNCIONES DEL BACKEND
// ============================================

/**
 * Inicia el servidor backend NestJS
 */
async function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const backendPath = isDev
      ? path.join(__dirname, '../../backend/src/main.ts')
      : path.join(process.resourcesPath, 'backend/dist/main.js');

    const command = isDev ? 'ts-node-dev' : 'node';
    const args = isDev 
      ? ['--respawn', '--transpile-only', backendPath]
      : [backendPath];

    console.log(`Iniciando backend: ${command} ${args.join(' ')}`);

    backendProcess = spawn(command, args, {
      cwd: isDev 
        ? path.join(__dirname, '../../backend')
        : path.join(process.resourcesPath, 'backend'),
      env: {
        ...process.env,
        BACKEND_PORT: String(BACKEND_PORT),
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5432',
        DATABASE_USER: 'postgres',
        DATABASE_PASSWORD: 'postgres',
        DATABASE_NAME: 'nexopos',
        NODE_ENV: isDev ? 'development' : 'production',
      },
      shell: true,
    });

    backendProcess.stdout?.on('data', (data) => {
      console.log(`[Backend] ${data}`);
      // Detectar cuando el backend está listo
      if (data.toString().includes('listening on')) {
        resolve();
      }
    });

    backendProcess.stderr?.on('data', (data) => {
      console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Error al iniciar backend:', error);
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend terminó con código: ${code}`);
    });

    // Timeout de seguridad
    setTimeout(() => resolve(), 10000);
  });
}

/**
 * Detiene el servidor backend
 */
function stopBackend(): void {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// ============================================
// FUNCIONES DE LA VENTANA
// ============================================

/**
 * Crea la ventana principal de la aplicación
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // Ocultar barra de menú por defecto
    autoHideMenuBar: true,
    // Mostrar cuando esté lista
    show: false,
  });

  // Cargar la URL del frontend
  const frontendUrl = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(frontendUrl);

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Manejar cierre de ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================
// AUTO-ACTUALIZACIÓN
// ============================================

function setupAutoUpdater(): void {
  // Configurar URL de actualizaciones (GitHub Releases)
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'TU_USUARIO_GITHUB',
    repo: 'sistema-gestion',
  });

  // Verificar actualizaciones al iniciar
  autoUpdater.checkForUpdatesAndNotify();

  // Eventos del actualizador
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Actualización disponible',
      message: 'Hay una nueva versión disponible. Se descargará automáticamente.',
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Actualización lista',
        message: 'La actualización se ha descargado. ¿Reiniciar ahora para aplicarla?',
        buttons: ['Reiniciar', 'Más tarde'],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on('error', (error) => {
    console.error('Error en auto-updater:', error);
  });
}

// ============================================
// CICLO DE VIDA DE LA APLICACIÓN
// ============================================

// Cuando Electron está listo
app.whenReady().then(async () => {
  console.log('Electron listo, iniciando aplicación...');

  try {
    // 1. Iniciar el backend
    console.log('Iniciando backend...');
    await startBackend();
    console.log('Backend iniciado correctamente');

    // 2. Crear la ventana
    createWindow();

    // 3. Configurar auto-actualización (solo en producción)
    if (!isDev) {
      setupAutoUpdater();
    }
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    dialog.showErrorBox(
      'Error al iniciar',
      `No se pudo iniciar la aplicación: ${error}`
    );
    app.quit();
  }
});

// Cuando todas las ventanas se cierran
app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cuando la app se activa (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Antes de cerrar la app
app.on('before-quit', () => {
  stopBackend();
});
```

### 2.2 Crear preload.ts

Crear el archivo `apps/desktop/electron/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

/**
 * El preload script expone APIs seguras al frontend.
 * Esto mantiene la seguridad de la aplicación.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Información de la aplicación
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Plataforma
  platform: process.platform,
  
  // Verificar si estamos en Electron
  isElectron: true,
});

// Tipos para TypeScript (exportar para uso en frontend)
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      platform: string;
      isElectron: boolean;
    };
  }
}
```

---

## Paso 3: Adaptar el Backend

Necesitamos hacer pequeños cambios para que el backend funcione embebido.

### 3.1 Modificar main.ts del backend

Editar `apps/backend/src/main.ts`:

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // CORS más permisivo para Electron
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Swagger solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NexoPOS API')
      .setDescription('API REST del sistema NexoPOS')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Backend listening on http://0.0.0.0:${port}`);
}

bootstrap();
```

### 3.2 Eliminar Redis (ya no es necesario)

Si tenés configuración de Redis en tu backend, podés eliminarla o hacerla opcional.

---

## Paso 4: Adaptar el Frontend

### 4.1 Modificar la URL del API

Editar o crear `apps/frontend/src/lib/api.ts`:

```typescript
import axios from 'axios';

/**
 * Detecta si estamos corriendo en Electron
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}

/**
 * Obtiene la URL base del API
 */
function getApiBaseUrl(): string {
  // En Electron, siempre es localhost
  if (isElectron()) {
    return 'http://localhost:3000';
  }
  
  // En desarrollo web, usar variable de entorno
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
}

// Cliente axios configurado
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 4.2 Modificar vite.config.ts

Editar `apps/frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Base URL para producción (archivos locales)
  base: './',
  
  // Configuración de build
  build: {
    outDir: '../desktop/dist/renderer',
    emptyOutDir: true,
    // Generar sourcemaps para debug
    sourcemap: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

---

## Paso 5: Configurar Empaquetado

### 5.1 Crear electron-builder.yml

Crear el archivo `apps/desktop/electron-builder.yml`:

```yaml
appId: com.nexopos.app
productName: NexoPOS
copyright: Copyright © 2024 Tu Empresa

# Directorios
directories:
  output: release
  buildResources: build

# Archivos a incluir
files:
  - dist/**/*
  - build/**/*
  - "!**/*.map"

# Archivos extra (backend compilado)
extraResources:
  - from: ../backend/dist
    to: backend/dist
    filter:
      - "**/*"
  - from: ../backend/node_modules
    to: backend/node_modules
    filter:
      - "**/*"
      - "!**/*.md"
      - "!**/test/**"
      - "!**/tests/**"
      - "!**/*.ts"

# Configuración Windows
win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico

# Configuración del instalador NSIS
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: NexoPOS

# Auto-actualización
publish:
  - provider: github
    owner: TU_USUARIO_GITHUB
    repo: sistema-gestion
    releaseType: release
```

### 5.2 Agregar icono

Necesitás un archivo `icon.ico` para Windows. Crealo o convertilo desde un PNG:

1. Usá una herramienta online como [ICO Convert](https://icoconvert.com/)
2. Subí tu logo en PNG (mínimo 256x256 px)
3. Descargá el `.ico` y guardalo en `apps/desktop/build/icon.ico`

---

## Paso 6: Configurar Auto-Actualización

### 6.1 Configurar GitHub para releases

1. **Crear un repositorio en GitHub** (si no lo tenés):
   - Ve a https://github.com/new
   - Nombre: `sistema-gestion` (o el que prefieras)
   - Puede ser privado

2. **Crear un Personal Access Token**:
   - Ve a https://github.com/settings/tokens
   - Click en "Generate new token (classic)"
   - Nombre: `electron-builder`
   - Permisos: `repo` (todos los de repo)
   - Copiá el token generado

3. **Guardar el token como variable de entorno**:

```powershell
# En PowerShell (temporal)
$env:GH_TOKEN = "tu_token_aqui"

# O permanente (agregar a variables de entorno de Windows)
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'tu_token_aqui', 'User')
```

### 6.2 Actualizar electron-builder.yml

Reemplazá `TU_USUARIO_GITHUB` con tu usuario real de GitHub en:
- `apps/desktop/electron/main.ts` (línea de setFeedURL)
- `apps/desktop/electron-builder.yml` (sección publish)

---

## Paso 7: Generar el Instalador

### 7.1 Preparar PostgreSQL para el cliente

Antes de distribuir, el cliente necesita PostgreSQL. Opciones:

**Opción A: El cliente instala PostgreSQL manualmente**

Crear instrucciones de instalación:

1. Descargar PostgreSQL 15 de https://www.postgresql.org/download/windows/
2. Instalar con las opciones por defecto
3. Recordar la contraseña del usuario `postgres`
4. Crear base de datos `nexopos`

**Opción B: Incluir script de primer inicio**

Crear un script que guíe al usuario la primera vez.

### 7.2 Compilar todo

```powershell
# Desde la raíz del proyecto
cd c:\Users\AgustinNotebook\Desktop\Proyectos\sistema-gestion

# Instalar dependencias del desktop
pnpm --filter @sistema/desktop install

# Compilar frontend
pnpm --filter @sistema/frontend build

# Compilar backend
pnpm --filter @sistema/backend build

# Compilar Electron y generar instalador
cd apps\desktop
pnpm build:electron
pnpm package
```

### 7.3 Encontrar el instalador

El instalador estará en:
```
apps/desktop/release/NexoPOS Setup 1.0.0.exe
```

---

## Paso 8: Distribuir Actualizaciones

Cuando necesites enviar una actualización:

### 8.1 Hacer los cambios en el código

Por ejemplo, arreglar un bug en el backend.

### 8.2 Incrementar la versión

Editar `apps/desktop/package.json`:

```json
{
  "version": "1.0.1",  // Era 1.0.0, ahora es 1.0.1
  ...
}
```

### 8.3 Compilar nueva versión

```powershell
cd apps\desktop
pnpm build
```

### 8.4 Publicar en GitHub

```powershell
# Commit de los cambios
git add .
git commit -m "fix: corregido error en facturación"

# Crear tag de versión
git tag v1.0.1

# Subir todo
git push origin main
git push origin v1.0.1
```

### 8.5 Publicar Release con el instalador

```powershell
# Esto sube automáticamente a GitHub Releases
pnpm package
```

O manualmente:
1. Ir a https://github.com/TU_USUARIO/sistema-gestion/releases
2. Click en "Draft a new release"
3. Tag: `v1.0.1`
4. Subir los archivos de `apps/desktop/release/`
5. Publicar

### 8.6 Los clientes reciben la actualización

La próxima vez que un cliente abra NexoPOS:
1. La app detecta que hay versión `1.0.1`
2. Descarga automáticamente en segundo plano
3. Muestra mensaje: "Hay una actualización disponible"
4. El usuario hace click en "Reiniciar"
5. ¡Listo! Tiene la nueva versión

---

## Solución de Problemas Comunes

### Error: "Cannot find module 'electron'"

```powershell
cd apps\desktop
pnpm install
```

### Error: "ENOENT: no such file or directory, open 'icon.ico'"

Asegurate de tener el archivo `apps/desktop/build/icon.ico`

### El backend no inicia

Verificar que PostgreSQL está corriendo:
```powershell
# Ver si el servicio está activo
Get-Service postgresql*

# Iniciar si está detenido
Start-Service postgresql-x64-15
```

### Error de permisos al empaquetar
(Error: "Cannot create symbolic link", "El cliente no dispone de un privilegio requerido")

Este error ocurre cuando Windows bloquea la creación de enlaces simbólicos necesarios para las herramientas de firma.

Solución 1 (Recomendada):
 **Ejecutar PowerShell como Administrador**.

Solución 2:
Activar el **Modo de desarrollador** en Windows:
1. Ir a Configuración > Actualización y seguridad > Para programadores
2. Activar "Modo de desarrollador"
3. Intentar compilar de nuevo (no requiere ser admin)

### La app no se actualiza

1. Verificar que `GH_TOKEN` está configurado
2. Verificar que el release está publicado (no como draft)
3. Verificar que la versión en `package.json` es mayor

---

## Resumen de Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Desarrollo (web tradicional) |
| `pnpm --filter @sistema/desktop dev` | Desarrollo en Electron |
| `pnpm --filter @sistema/desktop build` | Generar instalador |
| `git tag vX.X.X && git push --tags` | Crear nueva versión |

---

## ¿Necesitás ayuda?

Si tenés problemas siguiendo esta guía, los errores más comunes están en la sección "Solución de Problemas". Si el error no está ahí, contactame con:

1. El mensaje de error completo
2. En qué paso estabas
3. Qué comandos ejecutaste

¡Éxitos con tu aplicación de escritorio! 🚀
