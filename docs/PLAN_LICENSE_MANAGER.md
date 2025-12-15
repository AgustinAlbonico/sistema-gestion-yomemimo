# 🔐 License Manager - Sistema de Gestión de Licencias

## Descripción General

Sistema web centralizado para gestionar todos tus productos de software, clientes, licencias y pagos mensuales. Desde este panel podrás controlar remotamente qué clientes tienen acceso a cada software.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INFRAESTRUCTURA (100% GRATUITA)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────┐         ┌─────────────────────┐               │
│   │      VERCEL         │         │     SUPABASE        │               │
│   │   (Frontend React)  │         │   (PostgreSQL)      │               │
│   │                     │         │                     │               │
│   │   license-manager.  │    ◄──► │   Base de datos     │               │
│   │   vercel.app        │         │   + Auth            │               │
│   │                     │         │   + Edge Functions  │               │
│   │   GRATIS            │         │   GRATIS (500MB)    │               │
│   └─────────────────────┘         └─────────────────────┘               │
│                                            │                             │
│                                            │ API de Validación           │
│                                            ▼                             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    TUS PRODUCTOS (Electron Apps)                 │   │
│   │                                                                   │   │
│   │   ┌────────────┐   ┌────────────┐   ┌────────────┐              │   │
│   │   │  Sistema   │   │  Sistema   │   │   Otro     │              │   │
│   │   │  Gestión   │   │    POS     │   │  Software  │              │   │
│   │   │            │   │            │   │            │              │   │
│   │   │ Cliente A  │   │ Cliente B  │   │ Cliente C  │              │   │
│   │   │ Cliente D  │   │ Cliente E  │   │            │              │   │
│   │   └────────────┘   └────────────┘   └────────────┘              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Datos

### Diagrama Entidad-Relación

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     PRODUCTS     │       │     CLIENTS      │       │     LICENSES     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ name             │       │ business_name    │       │ license_key      │
│ code             │◄──────│ owner_name       │       │ client_id (FK)   │──┐
│ description      │   ┌──►│ email            │◄──────│ product_id (FK)  │──┤
│ monthly_price    │   │   │ phone            │       │ is_active        │  │
│ version          │   │   │ address          │       │ activated_at     │  │
│ is_active        │   │   │ notes            │       │ expires_at       │  │
│ created_at       │   │   │ is_active        │       │ last_check_at    │  │
└──────────────────┘   │   │ created_at       │       │ machine_id       │  │
                       │   └──────────────────┘       │ app_version      │  │
                       │                              │ created_at       │  │
                       │                              └──────────────────┘  │
                       │                                                    │
                       │   ┌──────────────────┐       ┌──────────────────┐  │
                       │   │   PAYMENTS       │       │  LICENSE_LOGS    │  │
                       │   ├──────────────────┤       ├──────────────────┤  │
                       │   │ id (PK)          │       │ id (PK)          │  │
                       └───│ client_id (FK)   │       │ license_id (FK)  │◄─┘
                           │ license_id (FK)  │       │ action           │
                           │ amount           │       │ ip_address       │
                           │ payment_date     │       │ details          │
                           │ payment_method   │       │ created_at       │
                           │ period_month     │       └──────────────────┘
                           │ period_year      │
                           │ notes            │
                           │ created_at       │
                           └──────────────────┘
```

### Tablas Detalladas

#### 1. `products` (Productos/Softwares)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | VARCHAR(100) | Nombre del producto (ej: "Sistema de Gestión") |
| code | VARCHAR(20) | Código único (ej: "SG", "POS") |
| description | TEXT | Descripción del producto |
| monthly_price | DECIMAL(10,2) | Precio mensual |
| version | VARCHAR(20) | Versión actual (ej: "1.0.0") |
| download_url | VARCHAR(500) | URL del instalador |
| is_active | BOOLEAN | Si el producto está activo |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

#### 2. `clients` (Clientes)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| business_name | VARCHAR(200) | Nombre del negocio |
| owner_name | VARCHAR(200) | Nombre del dueño |
| cuit | VARCHAR(20) | CUIT/CUIL (opcional) |
| email | VARCHAR(100) | Email de contacto |
| phone | VARCHAR(50) | Teléfono |
| address | TEXT | Dirección |
| city | VARCHAR(100) | Ciudad |
| province | VARCHAR(100) | Provincia |
| notes | TEXT | Notas internas |
| is_active | BOOLEAN | Si el cliente está activo |
| created_at | TIMESTAMP | Fecha de alta |
| updated_at | TIMESTAMP | Última actualización |

#### 3. `licenses` (Licencias)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| license_key | VARCHAR(50) | Clave única de licencia (ABC123-XYZ789-...) |
| client_id | UUID (FK) | Cliente asociado |
| product_id | UUID (FK) | Producto asociado |
| is_active | BOOLEAN | Si la licencia está activa |
| activated_at | TIMESTAMP | Cuándo se activó por primera vez |
| expires_at | TIMESTAMP | Fecha de vencimiento |
| last_check_at | TIMESTAMP | Última vez que el software validó |
| machine_id | VARCHAR(100) | ID único de la PC del cliente |
| app_version | VARCHAR(20) | Versión instalada |
| notes | TEXT | Notas internas |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

#### 4. `payments` (Pagos)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| client_id | UUID (FK) | Cliente que pagó |
| license_id | UUID (FK) | Licencia asociada |
| amount | DECIMAL(10,2) | Monto pagado |
| payment_date | DATE | Fecha del pago |
| payment_method | VARCHAR(50) | Método (efectivo, transferencia, etc) |
| period_month | INTEGER | Mes que cubre (1-12) |
| period_year | INTEGER | Año que cubre |
| receipt_number | VARCHAR(50) | Número de recibo (opcional) |
| notes | TEXT | Notas |
| created_at | TIMESTAMP | Fecha de registro |

#### 5. `license_logs` (Historial de Validaciones)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| license_id | UUID (FK) | Licencia |
| action | VARCHAR(50) | Tipo de acción (VALIDATE, ACTIVATE, DENY, etc) |
| ip_address | VARCHAR(45) | IP desde donde se validó |
| machine_id | VARCHAR(100) | ID de la máquina |
| app_version | VARCHAR(20) | Versión de la app |
| result | VARCHAR(20) | SUCCESS / FAILED |
| details | TEXT | Detalles adicionales |
| created_at | TIMESTAMP | Fecha/hora del evento |

---

## 🖥️ Pantallas del Sistema

### 1. Login
- Solo vos tenés acceso
- Autenticación con Supabase Auth
- Email + contraseña

### 2. Dashboard Principal
```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                           [Tu Nombre] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ 💰 Ingresos    │  │ 👥 Clientes    │  │ 🔑 Licencias   │         │
│  │    Mes         │  │    Activos     │  │    Activas     │         │
│  │                │  │                │  │                │         │
│  │   $150.000     │  │      24        │  │      28        │         │
│  │   ▲ +15%       │  │   ▲ +2         │  │   ▲ +3         │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│                                                                      │
│  ┌────────────────────────────────────┐  ┌──────────────────────┐   │
│  │ ⚠️ Atención Requerida             │  │ 📈 Ingresos x Mes    │   │
│  ├────────────────────────────────────┤  │                      │   │
│  │ 🔴 3 licencias vencidas            │  │    ████              │   │
│  │ 🟡 5 vencen en 7 días              │  │   █████ █            │   │
│  │ 🟡 2 clientes sin pagar            │  │  ██████ ██           │   │
│  │ ✅ 18 pagos registrados este mes   │  │ ███████ ███          │   │
│  └────────────────────────────────────┘  └──────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📋 Últimas Actividades                                         │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Negocio XYZ validó licencia hace 5 min                       │ │
│  │ • Registraste pago de Negocio ABC hace 2 horas                 │ │
│  │ • Creaste licencia para Negocio DEF hace 1 día                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Gestión de Productos
```
┌─────────────────────────────────────────────────────────────────────┐
│  📦 Productos                                    [+ Nuevo Producto] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Buscar producto...                                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Producto        │ Código │ Versión │ Precio   │ Licencias │ ⚙️ │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ Sistema Gestión │ SG     │ 1.0.0   │ $8.000   │ 15 activas│ ⋮ │ │
│  │ Sistema POS     │ POS    │ 2.1.0   │ $5.000   │ 8 activas │ ⋮ │ │
│  │ Inventario Pro  │ INV    │ 1.2.0   │ $6.000   │ 5 activas │ ⋮ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Gestión de Clientes
```
┌─────────────────────────────────────────────────────────────────────┐
│  👥 Clientes                                       [+ Nuevo Cliente]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Buscar cliente...          │ Estado: [Todos ▼] │ Producto  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Cliente          │ Productos  │ Estado Pago │ Vence    │ ⚙️   │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ 🏪 Almacén Norte │ SG         │ ✅ Al día   │ 15 Ene   │  ⋮   │ │
│  │ 🏪 Kiosko Centro │ SG, POS    │ ⚠️ 5 días   │ 19 Dic   │  ⋮   │ │
│  │ 🏪 Super Sur     │ SG         │ 🔴 Vencido  │ 01 Dic   │  ⋮   │ │
│  │ 🏪 Ferretería    │ INV        │ ✅ Al día   │ 28 Dic   │  ⋮   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5. Gestión de Licencias
```
┌─────────────────────────────────────────────────────────────────────┐
│  🔑 Licencias                                     [+ Nueva Licencia]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Filtros: [Cliente ▼] [Producto ▼] [Estado ▼]                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Licencia           │ Cliente        │ Producto │ Estado │ ⚙️  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ ABC123-XYZ789-DEF  │ Almacén Norte  │ SG       │ ✅     │  ⋮  │ │
│  │ GHI456-UVW012-JKL  │ Kiosko Centro  │ SG       │ ⚠️     │  ⋮  │ │
│  │ MNO789-RST345-PQR  │ Kiosko Centro  │ POS      │ ⚠️     │  ⋮  │ │
│  │ STU012-WXY678-ABC  │ Super Sur      │ SG       │ 🔴     │  ⋮  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Al hacer click en una licencia:                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📋 Detalle de Licencia                                         │ │
│  │                                                                 │ │
│  │ Clave: ABC123-XYZ789-DEF456                    [📋 Copiar]     │ │
│  │ Cliente: Almacén Norte                                          │ │
│  │ Producto: Sistema de Gestión v1.0.0                            │ │
│  │ Estado: ✅ Activa                                               │ │
│  │ Vence: 15 de Enero 2025 (32 días)                              │ │
│  │ Última conexión: Hace 2 horas                                   │ │
│  │ PC: DESKTOP-ABC123                                              │ │
│  │ IP última: 190.xxx.xxx.xxx                                      │ │
│  │                                                                 │ │
│  │ [🔄 Renovar 30 días] [⏸️ Suspender] [🗑️ Eliminar]              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. Gestión de Pagos
```
┌─────────────────────────────────────────────────────────────────────┐
│  💰 Pagos                                          [+ Registrar Pago]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────┐                                │
│  │ 📅 Diciembre 2024          [◄►] │  Total: $128.000               │
│  └─────────────────────────────────┘  Cobrado: $104.000 (81%)       │
│                                       Pendiente: $24.000            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 Pendientes de Cobro (3)                                     │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ Cliente          │ Producto │ Monto   │ Vence     │            │ │
│  │ Super Sur        │ SG       │ $8.000  │ 01 Dic ❗ │ [Cobrar]   │ │
│  │ Kiosko Centro    │ SG+POS   │ $13.000 │ 19 Dic    │ [Cobrar]   │ │
│  │ Farmacia López   │ SG       │ $8.000  │ 25 Dic    │ [Cobrar]   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Pagos Registrados (12)                                      │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ Fecha      │ Cliente        │ Producto │ Monto   │ Método      │ │
│  │ 14/12/2024 │ Almacén Norte  │ SG       │ $8.000  │ Transferenc │ │
│  │ 12/12/2024 │ Ferretería Jon │ INV      │ $6.000  │ Efectivo    │ │
│  │ ...        │ ...            │ ...      │ ...     │ ...         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7. Historial/Logs
```
┌─────────────────────────────────────────────────────────────────────┐
│  📜 Historial de Actividad                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Filtros: [Licencia ▼] [Acción ▼] [Fecha desde] [Fecha hasta]       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Fecha/Hora          │ Licencia  │ Acción    │ Resultado │ IP   │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ 14/12 15:30:22      │ ABC123... │ VALIDATE  │ ✅ OK     │ 190..│ │
│  │ 14/12 15:28:10      │ GHI456... │ VALIDATE  │ ⚠️ WARN   │ 181..│ │
│  │ 14/12 14:55:00      │ STU012... │ VALIDATE  │ 🔴 DENIED │ 192..│ │
│  │ 14/12 09:00:00      │ ABC123... │ VALIDATE  │ ✅ OK     │ 190..│ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API de Validación de Licencias

Endpoint que consultarán todos tus productos:

### `POST /api/validate`

**Request:**
```json
{
  "license_key": "ABC123-XYZ789-DEF456",
  "product_code": "SG",
  "machine_id": "DESKTOP-XYZ123",
  "app_version": "1.0.0"
}
```

**Response Exitosa:**
```json
{
  "valid": true,
  "client_name": "Almacén Norte",
  "product_name": "Sistema de Gestión",
  "expires_at": "2025-01-15T00:00:00Z",
  "days_remaining": 32
}
```

**Response Error (Vencida):**
```json
{
  "valid": false,
  "error": "LICENSE_EXPIRED",
  "message": "Su licencia venció el 01/12/2024. Contacte al proveedor para renovar.",
  "expired_at": "2024-12-01T00:00:00Z"
}
```

**Response Error (Desactivada):**
```json
{
  "valid": false,
  "error": "LICENSE_DISABLED",
  "message": "Su licencia ha sido suspendida. Contacte al proveedor."
}
```

**Response Error (No existe):**
```json
{
  "valid": false,
  "error": "LICENSE_NOT_FOUND",
  "message": "La clave de licencia no es válida."
}
```

---

## 📁 Estructura del Proyecto

```
license-manager/
├── apps/
│   ├── backend/                    # NestJS API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # Autenticación (Supabase)
│   │   │   │   ├── products/       # CRUD productos
│   │   │   │   ├── clients/        # CRUD clientes
│   │   │   │   ├── licenses/       # CRUD licencias + validación
│   │   │   │   ├── payments/       # CRUD pagos
│   │   │   │   ├── logs/           # Historial
│   │   │   │   └── dashboard/      # Estadísticas
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── decorators/
│   │   │   │   └── utils/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── frontend/                   # React + Vite
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/             # Componentes base
│       │   │   └── layout/         # Layout principal
│       │   ├── features/
│       │   │   ├── dashboard/
│       │   │   ├── products/
│       │   │   ├── clients/
│       │   │   ├── licenses/
│       │   │   ├── payments/
│       │   │   └── logs/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── App.tsx
│       └── package.json
│
├── packages/                       # Código compartido
│   └── shared/
│       └── types/                  # TypeScript types
│
├── supabase/
│   └── migrations/                 # Migraciones SQL
│
├── docker-compose.yml              # Para desarrollo local
├── package.json
└── README.md
```

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Uso |
|------|------------|-----|
| **Frontend** | React + Vite | UI del panel |
| **Estilos** | TailwindCSS + shadcn/ui | Componentes bonitos |
| **Estado** | React Query + Zustand | Manejo de estado |
| **Backend** | NestJS | API REST |
| **Base de datos** | PostgreSQL (Supabase) | Almacenamiento |
| **Auth** | Supabase Auth | Login seguro |
| **Hosting Frontend** | Vercel | Gratis |
| **Hosting Backend** | Vercel Serverless / Railway | Gratis |
| **Hosting DB** | Supabase | Gratis (500MB) |

---

## 💰 Costos

| Servicio | Plan | Costo | Límites |
|----------|------|-------|---------|
| Vercel | Free | $0 | 100GB bandwidth |
| Supabase | Free | $0 | 500MB DB, 50K requests/mes |
| Railway (si necesitás backend persistente) | Free | $0 | $5 crédito/mes |
| **Total** | | **$0/mes** | Suficiente para ~50 clientes |

Cuando escales mucho (>50-100 clientes activos), podrías necesitar:
- Supabase Pro: $25/mes
- Railway: $5-10/mes

---

## 📅 Fases de Implementación

### FASE 1: Setup Inicial (2-3 horas)
1. Crear cuenta en Supabase
2. Crear proyecto nuevo
3. Configurar autenticación
4. Crear tablas en Supabase
5. Crear proyecto frontend en Vercel

### FASE 2: Backend API (4-6 horas)
1. Setup NestJS
2. Conectar con Supabase
3. CRUD Products
4. CRUD Clients
5. CRUD Licenses
6. CRUD Payments
7. Endpoint de validación pública
8. Logs automáticos

### FASE 3: Frontend - Estructura (3-4 horas)
1. Setup Vite + React + TailwindCSS
2. Layout principal (sidebar, header)
3. Configurar React Query
4. Configurar rutas
5. Auth con Supabase

### FASE 4: Frontend - Páginas (6-8 horas)
1. Dashboard con estadísticas
2. CRUD Productos
3. CRUD Clientes
4. CRUD Licencias
5. CRUD Pagos
6. Página de Logs

### FASE 5: Funcionalidades Avanzadas (3-4 horas)
1. Notificaciones de vencimiento
2. Exportar datos (CSV/Excel)
3. Acciones en lote (renovar múltiples)
4. Estadísticas avanzadas

### FASE 6: Integración con tus Productos (2-3 horas)
1. Crear módulo de validación para Electron
2. Documentar integración
3. Probar con Sistema de Gestión actual

### FASE 7: Deploy y Testing (2-3 horas)
1. Deploy a Vercel
2. Configurar dominio (opcional)
3. Testing completo
4. Documentación

---

## ⏱️ Tiempo Total Estimado

| Fase | Horas |
|------|-------|
| Setup Inicial | 2-3 |
| Backend API | 4-6 |
| Frontend - Estructura | 3-4 |
| Frontend - Páginas | 6-8 |
| Funcionalidades Avanzadas | 3-4 |
| Integración con Productos | 2-3 |
| Deploy y Testing | 2-3 |
| **Total** | **22-31 horas** |

---

## 🔐 Seguridad

1. **Autenticación**: Solo vos podés acceder al panel (Supabase Auth)
2. **API de validación**: Pública pero rate-limited
3. **Claves de licencia**: Generadas de forma segura, imposibles de adivinar
4. **Machine ID**: Vincula licencia a una PC específica (opcional)
5. **Logs**: Todo queda registrado para auditoría

---

## 📱 Flujos de Uso

### Cuando vendés a un nuevo cliente:
1. Creás el cliente en el panel
2. Asignás el/los productos que compró
3. Generás la licencia (se auto-genera la key)
4. Le enviás el instalador + la clave de licencia
5. El cliente instala, ingresa la clave, y listo

### Cuando un cliente paga la mensualidad:
1. Vas a Pagos → Registrar Pago
2. Seleccionás cliente y monto
3. La licencia se renueva automáticamente (+30 días)
4. El cliente no tiene que hacer nada

### Cuando un cliente NO paga:
1. Simplemente no registrás el pago
2. Cuando vence, la app le muestra mensaje
3. Si querés ser más estricto, podés desactivar manualmente

### Cuando publicás una actualización:
1. Actualizás la versión del producto en el panel
2. Subís el nuevo instalador
3. Los clientes reciben la actualización automática (Electron auto-updater)

---

## ❓ Siguiente Paso

¿Querés que empecemos a implementar este sistema? 

Podemos arrancar por:
1. **Supabase** (crear las tablas y configurar auth)
2. **Frontend** (setup + login + dashboard básico)
3. **O si preferís, primero terminar el plan de Electron del sistema actual**

¿Qué preferís hacer primero?
