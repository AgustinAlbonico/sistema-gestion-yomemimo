# 📦 Plan de Distribución - Sistema de Gestión

## Resumen Ejecutivo

Convertir el sistema actual (React + NestJS + PostgreSQL) en una aplicación de escritorio distribuible con:
- **Instalador `.exe`** para Windows
- **Sistema de licencias** con control de pagos
- **Auto-actualizaciones** remotas
- **PostgreSQL embebido** para grandes volúmenes de datos

---

## 🏗️ Arquitectura Final

```
┌────────────────────────────────────────────────────────────────────┐
│                         APLICACIÓN ELECTRON                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                     PROCESO PRINCIPAL                        │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │  │
│   │  │ PostgreSQL  │  │   NestJS    │  │  Validador Licencia  │ │  │
│   │  │  Embedded   │  │   Backend   │  │  (Supabase client)   │ │  │
│   │  │             │  │             │  │                      │ │  │
│   │  │ Puerto:5432 │  │ Puerto:3001 │  │  Verifica al inicio  │ │  │
│   │  └─────────────┘  └─────────────┘  └──────────────────────┘ │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                     PROCESO RENDERER                         │  │
│   │                   (Ventana del navegador)                    │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │              Frontend React (Vite build)                 ││  │
│   │  │                                                          ││  │
│   │  │              Comunica con Backend en localhost:3001      ││  │
│   │  └─────────────────────────────────────────────────────────┘│  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
                                │
                                │ Validación de licencia (1 request)
                                ▼
                    ┌─────────────────────────┐
                    │   SUPABASE (Gratuito)   │
                    │                         │
                    │  - Tabla: licenses      │
                    │  - Tabla: clients       │
                    │                         │
                    └─────────────────────────┘
```

---

## 📅 Fases de Implementación

### FASE 1: Configuración de Supabase (Licencias)
**Duración estimada: 1-2 horas**

#### 1.1 Crear cuenta en Supabase
1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta gratuita
3. Crear nuevo proyecto (ej: `sistema-gestion-licenses`)
4. Guardar las credenciales:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

#### 1.2 Crear tablas de licencias
Ejecutar en SQL Editor de Supabase:

```sql
-- Tabla de clientes
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de licencias
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  license_key VARCHAR(64) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_check_at TIMESTAMP WITH TIME ZONE,
  machine_id VARCHAR(255), -- Para vincular a una PC específica
  version VARCHAR(20), -- Versión de la app instalada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos (historial)
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50), -- efectivo, transferencia, etc
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_client_id ON licenses(client_id);
CREATE INDEX idx_licenses_is_active ON licenses(is_active);

-- Función para generar license key
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS VARCHAR(64) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(64) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..24 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    IF i IN (6, 12, 18) THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar license key
CREATE OR REPLACE FUNCTION set_license_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_key IS NULL OR NEW.license_key = '' THEN
    NEW.license_key := generate_license_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_license_key
  BEFORE INSERT ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION set_license_key();

-- RLS (Row Level Security) - Solo lectura para la app
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Licenses are viewable by license key" ON licenses
  FOR SELECT USING (true);

-- Bloquear inserts/updates/deletes desde el client
CREATE POLICY "No inserts from client" ON licenses
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No updates from client" ON licenses
  FOR UPDATE USING (false);

CREATE POLICY "No deletes from client" ON licenses
  FOR DELETE USING (false);
```

#### 1.3 Crear API para validación
En Supabase, ir a "Edge Functions" y crear:

```typescript
// supabase/functions/validate-license/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { license_key, machine_id, version } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar licencia
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*, clients(*)')
      .eq('license_key', license_key)
      .single()

    if (error || !license) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Licencia no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verificar si está activa
    if (!license.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Licencia desactivada. Contacte al proveedor.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verificar vencimiento
    const expiresAt = new Date(license.expires_at)
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Licencia vencida. Contacte al proveedor para renovar.',
          expired_at: license.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Actualizar último check y machine_id
    await supabase
      .from('licenses')
      .update({ 
        last_check_at: new Date().toISOString(),
        machine_id: machine_id,
        version: version
      })
      .eq('id', license.id)

    return new Response(
      JSON.stringify({ 
        valid: true, 
        client_name: license.clients.business_name,
        expires_at: license.expires_at,
        days_remaining: Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, error: 'Error interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

---

### FASE 2: Preparar el Proyecto para Electron
**Duración estimada: 2-3 horas**

#### 2.1 Reestructurar el proyecto
Estructura final:

```
sistema-gestion/
├── apps/
│   ├── backend/           # NestJS (sin cambios mayores)
│   ├── frontend/          # React (sin cambios mayores)
│   └── electron/          # NUEVO - Wrapper de Electron
│       ├── src/
│       │   ├── main.ts           # Proceso principal
│       │   ├── preload.ts        # Bridge seguro
│       │   ├── license/
│       │   │   └── validator.ts  # Validador de licencias
│       │   └── postgres/
│       │       └── manager.ts    # Gestor de PostgreSQL embebido
│       ├── resources/
│       │   └── postgres/         # Binarios de PostgreSQL embebido
│       ├── package.json
│       ├── electron-builder.yml  # Configuración del instalador
│       └── tsconfig.json
├── packages/
├── docs/
└── package.json
```

#### 2.2 Instalar dependencias de Electron
```bash
# Crear carpeta electron
mkdir apps/electron
cd apps/electron
npm init -y

# Instalar dependencias
npm install electron electron-builder
npm install -D typescript @types/node

# Para PostgreSQL embebido
npm install pg-embed  # O usar postgresql-portable

# Para auto-updates
npm install electron-updater

# Para obtener machine ID único
npm install node-machine-id
```

#### 2.3 Crear archivo principal de Electron

```typescript
// apps/electron/src/main.ts
import { app, BrowserWindow, dialog } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { validateLicense } from './license/validator';
import { startPostgres, stopPostgres } from './postgres/manager';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

// Configuración
const BACKEND_PORT = 3001;
const POSTGRES_PORT = 5432;
const LICENSE_KEY_STORAGE = 'license.key';

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../resources/icon.ico'),
    title: 'Sistema de Gestión',
    show: false, // Mostrar cuando esté listo
  });

  // Cargar el frontend
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'backend')
      : path.join(__dirname, '../../backend');

    // Configurar variables de entorno para el backend
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(BACKEND_PORT),
      DB_HOST: 'localhost',
      DB_PORT: String(POSTGRES_PORT),
      DB_NAME: 'sistema_gestion',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
    };

    backendProcess = spawn('node', ['dist/main.js'], {
      cwd: backendPath,
      env,
      stdio: 'pipe',
    });

    backendProcess.stdout?.on('data', (data) => {
      console.log(`Backend: ${data}`);
      if (data.toString().includes('Listening on port')) {
        resolve();
      }
    });

    backendProcess.stderr?.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', reject);
    
    // Timeout de 30 segundos
    setTimeout(() => reject(new Error('Backend timeout')), 30000);
  });
}

async function initialize() {
  try {
    // 1. Mostrar splash screen
    const splashWindow = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
    });
    splashWindow.loadFile(path.join(__dirname, '../resources/splash.html'));

    // 2. Validar licencia
    const licenseResult = await validateLicense();
    if (!licenseResult.valid) {
      splashWindow.close();
      dialog.showErrorBox(
        'Licencia Inválida',
        licenseResult.error || 'Su licencia no es válida. Contacte al proveedor.'
      );
      app.quit();
      return;
    }

    // 3. Iniciar PostgreSQL embebido
    await startPostgres();

    // 4. Iniciar Backend
    await startBackend();

    // 5. Cerrar splash y mostrar app
    splashWindow.close();
    await createWindow();

    // 6. Verificar actualizaciones
    autoUpdater.checkForUpdatesAndNotify();

  } catch (error) {
    dialog.showErrorBox('Error de Inicio', `No se pudo iniciar la aplicación: ${error}`);
    app.quit();
  }
}

app.whenReady().then(initialize);

app.on('window-all-closed', async () => {
  // Detener backend
  if (backendProcess) {
    backendProcess.kill();
  }
  
  // Detener PostgreSQL
  await stopPostgres();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización disponible',
    message: 'Hay una nueva versión disponible. Se descargará automáticamente.',
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización lista',
    message: 'La actualización se instalará cuando reinicie la aplicación.',
    buttons: ['Reiniciar ahora', 'Más tarde'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
```

#### 2.4 Crear validador de licencias

```typescript
// apps/electron/src/license/validator.ts
import { app } from 'electron';
import { machineIdSync } from 'node-machine-id';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/validate-license`;

interface LicenseResult {
  valid: boolean;
  error?: string;
  clientName?: string;
  expiresAt?: string;
  daysRemaining?: number;
}

function getLicenseKeyPath(): string {
  return path.join(app.getPath('userData'), 'license.key');
}

function getLicenseKey(): string | null {
  try {
    const keyPath = getLicenseKeyPath();
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf-8').trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLicenseKey(key: string): void {
  const keyPath = getLicenseKeyPath();
  fs.writeFileSync(keyPath, key.trim(), 'utf-8');
}

export async function validateLicense(): Promise<LicenseResult> {
  const licenseKey = getLicenseKey();
  
  if (!licenseKey) {
    return { valid: false, error: 'No se encontró clave de licencia' };
  }

  try {
    const machineId = machineIdSync();
    const version = app.getVersion();

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: licenseKey,
        machine_id: machineId,
        version: version,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { valid: false, error: data.error };
    }

    return {
      valid: data.valid,
      clientName: data.client_name,
      expiresAt: data.expires_at,
      daysRemaining: data.days_remaining,
    };

  } catch (error) {
    // Error de red - podría permitir uso limitado o bloquear
    return { valid: false, error: 'No se pudo verificar la licencia. Verifique su conexión a internet.' };
  }
}
```

#### 2.5 Crear gestor de PostgreSQL embebido

```typescript
// apps/electron/src/postgres/manager.ts
import { app } from 'electron';
import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

let postgresProcess: ChildProcess | null = null;

const POSTGRES_PORT = 5432;

function getPostgresPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'postgres')
    : path.join(__dirname, '../../resources/postgres');
}

function getDataPath(): string {
  return path.join(app.getPath('userData'), 'postgres-data');
}

export async function startPostgres(): Promise<void> {
  const postgresPath = getPostgresPath();
  const dataPath = getDataPath();
  const pgBin = path.join(postgresPath, 'bin');

  // Inicializar base de datos si no existe
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
    
    // Inicializar cluster
    execSync(`"${path.join(pgBin, 'initdb.exe')}" -D "${dataPath}" -U postgres -E UTF8`, {
      env: { ...process.env, PGPASSWORD: 'postgres' },
    });
  }

  return new Promise((resolve, reject) => {
    postgresProcess = spawn(
      path.join(pgBin, 'pg_ctl.exe'),
      ['start', '-D', dataPath, '-l', path.join(dataPath, 'logfile'), '-o', `-p ${POSTGRES_PORT}`],
      { stdio: 'pipe' }
    );

    postgresProcess.on('error', reject);
    
    // Esperar a que PostgreSQL esté listo
    let attempts = 0;
    const checkReady = setInterval(async () => {
      attempts++;
      try {
        execSync(`"${path.join(pgBin, 'pg_isready.exe')}" -p ${POSTGRES_PORT}`, { stdio: 'ignore' });
        clearInterval(checkReady);
        
        // Crear base de datos si no existe
        try {
          execSync(`"${path.join(pgBin, 'createdb.exe')}" -p ${POSTGRES_PORT} -U postgres sistema_gestion`, {
            stdio: 'ignore',
          });
        } catch {
          // Ya existe, ignorar
        }
        
        resolve();
      } catch {
        if (attempts > 30) {
          clearInterval(checkReady);
          reject(new Error('PostgreSQL no pudo iniciar'));
        }
      }
    }, 1000);
  });
}

export async function stopPostgres(): Promise<void> {
  const postgresPath = getPostgresPath();
  const dataPath = getDataPath();
  const pgBin = path.join(postgresPath, 'bin');

  try {
    execSync(`"${path.join(pgBin, 'pg_ctl.exe')}" stop -D "${dataPath}" -m fast`, { stdio: 'ignore' });
  } catch {
    // Ignorar errores al detener
  }
}
```

---

### FASE 3: Configurar Electron Builder
**Duración estimada: 1-2 horas**

#### 3.1 Crear configuración del instalador

```yaml
# apps/electron/electron-builder.yml
appId: com.tuempresa.sistema-gestion
productName: Sistema de Gestión
copyright: Copyright © 2024 Tu Empresa

directories:
  output: dist
  buildResources: resources

files:
  - "dist/**/*"
  - "resources/**/*"

extraResources:
  # Frontend compilado
  - from: "../frontend/dist"
    to: "frontend"
  # Backend compilado  
  - from: "../backend/dist"
    to: "backend"
  - from: "../backend/node_modules"
    to: "backend/node_modules"
  # PostgreSQL portable
  - from: "./resources/postgres"
    to: "postgres"

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: resources/icon.ico
  artifactName: "${productName}-Setup-${version}.${ext}"

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: resources/icon.ico
  uninstallerIcon: resources/icon.ico
  installerHeaderIcon: resources/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "Sistema de Gestión"
  include: installer.nsh
  license: LICENSE.txt

publish:
  provider: github
  owner: tu-usuario
  repo: sistema-gestion-releases
  releaseType: release
```

#### 3.2 Crear scripts de build

```json
// apps/electron/package.json
{
  "name": "@sistema/electron",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "dev": "tsc && electron .",
    "build": "tsc",
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder",
    "publish": "npm run build && electron-builder --publish always"
  },
  "dependencies": {
    "electron-updater": "^6.1.0",
    "node-machine-id": "^1.1.12"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "typescript": "^5.0.0"
  }
}
```

---

### FASE 4: Modificaciones al Backend
**Duración estimada: 1 hora**

#### 4.1 Agregar endpoint de información de licencia
Para mostrar en el frontend cuántos días quedan, nombre del cliente, etc.

```typescript
// apps/backend/src/modules/license/license.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('license')
export class LicenseController {
  @Get('info')
  getLicenseInfo() {
    // Esta info viene de Electron vía variable de entorno
    return {
      clientName: process.env.LICENSE_CLIENT_NAME || 'Demo',
      expiresAt: process.env.LICENSE_EXPIRES_AT || null,
      daysRemaining: process.env.LICENSE_DAYS_REMAINING || null,
    };
  }
}
```

---

### FASE 5: Crear Panel de Administración de Licencias
**Duración estimada: 3-4 horas**

Crear una app web simple (puede ser en el mismo Supabase con su Studio, o una app React separada) para:

1. **Ver todos los clientes**
2. **Crear nuevas licencias**
3. **Renovar licencias** (extender fecha)
4. **Desactivar licencias** (cuando no pagan)
5. **Ver historial de pagos**
6. **Ver estadísticas**:
   - Última vez que cada cliente usó el sistema
   - Versión instalada
   - Machine ID

---

### FASE 6: Descargar y Configurar PostgreSQL Portable
**Duración estimada: 1-2 horas**

1. Descargar PostgreSQL portable desde:
   - https://www.enterprisedb.com/download-postgresql-binaries
   
2. Extraer solo los archivos necesarios:
   - `bin/pg_ctl.exe`
   - `bin/postgres.exe`
   - `bin/initdb.exe`
   - `bin/createdb.exe`
   - `bin/pg_isready.exe`
   - `lib/*` (todas las DLLs necesarias)
   - `share/*` (archivos de configuración)

3. Colocar en `apps/electron/resources/postgres/`

---

### FASE 7: Testing y Empaquetado Final
**Duración estimada: 2-3 horas**

#### 7.1 Build completo
```bash
# 1. Build frontend
cd apps/frontend
npm run build

# 2. Build backend
cd ../backend
npm run build

# 3. Build y empaquetar Electron
cd ../electron
npm run dist
```

#### 7.2 Probar instalador
1. Ejecutar el `.exe` generado en `apps/electron/dist/`
2. Verificar instalación completa
3. Probar con licencia válida
4. Probar con licencia vencida
5. Probar sin internet
6. Probar actualizaciones

---

### FASE 8: Configurar Repositorio de Releases
**Duración estimada: 1 hora**

1. Crear repositorio en GitHub: `sistema-gestion-releases` (puede ser privado)
2. Configurar GitHub Token en CI/CD o local
3. Cada vez que hagas un release:
   ```bash
   cd apps/electron
   npm run publish
   ```
4. Los clientes recibirán la actualización automáticamente

---

## 📊 Resumen de Tiempos

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1 | Configurar Supabase | 1-2 horas |
| 2 | Preparar proyecto Electron | 2-3 horas |
| 3 | Configurar Electron Builder | 1-2 horas |
| 4 | Modificaciones Backend | 1 hora |
| 5 | Panel Admin Licencias | 3-4 horas |
| 6 | PostgreSQL Portable | 1-2 horas |
| 7 | Testing y Empaquetado | 2-3 horas |
| 8 | Configurar Releases | 1 hora |
| **Total** | | **12-18 horas** |

---

## 🔧 Flujo de Trabajo del Día a Día

### Cuando agregás un nuevo cliente:
1. Entrás al panel admin (Supabase)
2. Creás el cliente con sus datos
3. Creás una licencia (se genera key automática)
4. Le enviás el instalador + la license key
5. El cliente instala y activa

### Cuando un cliente paga la mensualidad:
1. Vas al panel admin
2. Extendés la fecha de vencimiento (ej: +30 días)
3. El cliente no tiene que hacer nada, la próxima vez que abra la app se valida automáticamente

### Cuando un cliente NO paga:
1. Simplemente no extendés la fecha
2. Cuando vence, la app muestra mensaje de "Licencia vencida"
3. Si querés ser más agresivo, podés desactivar manualmente (is_active = false)

### Cuando tenés que hacer un fix/update:
1. Hacés los cambios en el código
2. Incrementás la versión en package.json
3. Ejecutás `npm run publish`
4. Todos los clientes reciben la actualización automáticamente

---

## ⚠️ Consideraciones Importantes

1. **Backup de datos del cliente**: Considerar agregar un sistema de backup automático a la nube (opcional, con consentimiento)

2. **Soporte remoto**: Podrías agregar TeamViewer o AnyDesk embebido para soporte

3. **Logs remotos**: Considerar enviar logs de errores a un servicio (Sentry) para detectar problemas

4. **Múltiples PCs**: Si un cliente quiere usar en 2 PCs, necesitarías ajustar el sistema de licencias

5. **Protección del código**: Electron no protege el código fuente. Si querés más protección, considerá ofuscar el código JavaScript

---

## 📞 Próximos Pasos

1. ¿Querés que empecemos con la **Fase 1** (Supabase)?
2. ¿O preferís que primero prepare la **estructura de Electron** (Fase 2)?
3. ¿Tenés alguna duda sobre alguna fase específica?
