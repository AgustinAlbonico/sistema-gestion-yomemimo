# Sistema de Gestión - Monorepo

Monorepo para el sistema de gestión empresarial construido con **NestJS**, **React**, **TypeORM** y **PostgreSQL**.

## 📋 Requisitos Previos

- **Node.js** 20 LTS o superior
- **pnpm** (gestor de paquetes)
- **Docker** y **Docker Compose** (para base de datos)

## 🚀 Setup Inicial

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd sistema-gestion
```

### 2. Instalar pnpm (si no lo tienes)

```bash
npm install -g pnpm
```

### 3. Instalar dependencias

```bash
pnpm install
```

### 4. Configurar variables de entorno

Copiar el archivo de template y ajustar valores:

```bash
# En Windows PowerShell
Copy-Item env.template .env

# En Linux/Mac
cp env.template .env
```

Editar el archivo `.env` con tus valores. Los valores por defecto son:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=sistema_gestion
BACKEND_PORT=3000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
```

### 5. Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto levantará:
- **PostgreSQL** en el puerto `5432` 
- **Redis** en el puerto `6379`

Para verificar que están corriendo:

```bash
docker-compose ps
```

### 6. Ejecutar el proyecto en modo desarrollo

```bash
pnpm dev
```

Este comando ejecutará **simultáneamente**:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:5173`

## 📦 Estructura del Proyecto

```
sistema-gestion/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── app.service.ts
│   │   └── package.json
│   │
│   └── frontend/         # React + Vite
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   └── index.css
│       └── package.json
│
├── packages/             # (Futuro) Paquetes compartidos
├── docs/                 # Documentación
├── scripts/              # Scripts de utilidad
├── docker-compose.yml    # Contenedores de desarrollo
├── turbo.json            # Configuración de Turborepo
├── pnpm-workspace.yaml   # Workspaces de pnpm
└── package.json          # Root package.json
```

## 🛠️ Comandos Disponibles

### Desarrollo

```bash
pnpm dev          # Ejecutar backend + frontend en paralelo
pnpm dev --filter @sistema/backend   # Solo backend
pnpm dev --filter @sistema/frontend  # Solo frontend
```

### Build

```bash
pnpm build        # Compilar todo el proyecto
pnpm build --filter @sistema/backend
pnpm build --filter @sistema/frontend
```

### Linting

```bash
pnpm lint         # Ejecutar linter en todo el proyecto
```

### Testing

```bash
pnpm test         # Ejecutar tests
```

## 🗄️ Base de Datos

### Acceder al contenedor de PostgreSQL

```bash
docker exec -it sistema-gestion-db psql -U postgres -d sistema_gestion
```

### Ver logs de la base de datos

```bash
docker-compose logs -f postgres
```

### Detener los contenedores

```bash
docker-compose down
```

### Eliminar datos completamente (reset completo)

```bash
docker-compose down -v
```

## 🌐 Endpoints Disponibles

### Backend
- **API Base**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/api` (GET)

### Frontend
- **Aplicación**: `http://localhost:5173`

## 🐛 Troubleshooting

### El puerto 3000 está en uso

```bash
# En Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# En Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### El puerto 5432 está en uso (conflicto con PostgreSQL local)

Opción 1: Cambiar el puerto en `.env` y `docker-compose.yml`:
```env
DATABASE_PORT=5433
```

Opción 2: Detener PostgreSQL local
```bash
# Windows (usando servicios)
Stop-Service postgresql-x64-14

# Linux
sudo systemctl stop postgresql

# Mac
brew services stop postgresql
```

### Limpiar cache de Turbo

```bash
pnpm turbo clean
rm -rf node_modules
pnpm install
```

### Ver logs del backend o frontend

```bash
# Backend
cd apps/backend && pnpm dev

# Frontend
cd apps/frontend && pnpm dev
```

## 📚 Stack Tecnológico

### Backend
- **Framework**: NestJS 10
- **ORM**: TypeORM 0.3
- **Database**: PostgreSQL 15
- **Validación**: Zod 3.x + class-validator
- **Lenguaje**: TypeScript 5

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Estilos**: Tailwind CSS 3
- **HTTP Client**: Axios
- **Lenguaje**: TypeScript 5

### Infraestructura
- **Monorepo**: Turborepo + pnpm workspaces
- **Containers**: Docker + Docker Compose
- **Cache**: Redis 7

## 📖 Documentación Adicional

- [Stack Tecnológico Completo](./docs/stack-tecnologico.md)
- [Docker Setup](./docs/DOCKER-SETUP-COMPLETO.md)
- [Utilidades de Fechas (Frontend)](./apps/frontend/src/lib/date-utils.README.md)
- [Utilidades de Fechas (Backend)](./apps/backend/src/common/utils/date.utils.README.md)

## ⚠️ Importante: Manejo de Fechas

**SIEMPRE usa las utilidades centralizadas de fechas** para evitar problemas de zona horaria:

- **Frontend**: Importa desde `@/lib/date-utils`
- **Backend**: Importa desde `../../common/utils/date.utils`

**NUNCA uses `new Date('YYYY-MM-DD')` directamente** - puede causar que las fechas se muestren con un día de diferencia.

## 🤝 Contribuir

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

## 📝 Licencia

Privado - Todos los derechos reservados
