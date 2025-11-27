# Configuración Docker Completa para Sistema de Gestión

## Estructura de Archivos Docker

```
proyecto/
├── docker-compose.yml              # Orquestación de servicios
├── docker-compose.dev.yml          # Override para desarrollo
├── docker-compose.prod.yml         # Override para producción
├── .dockerignore                   # Archivos a ignorar
├── apps/
│   ├── backend/
│   │   ├── Dockerfile              # Backend container
│   │   ├── Dockerfile.dev          # Backend dev container
│   │   └── .dockerignore
│   └── frontend/
│       ├── Dockerfile              # Frontend container
│       ├── Dockerfile.dev          # Frontend dev container
│       ├── nginx.conf              # Nginx config para producción
│       └── .dockerignore
└── scripts/
    ├── init-db.sh                  # Script de inicialización de DB
    └── wait-for-it.sh              # Script para esperar servicios
```

---

## 1. docker-compose.yml (Base - Desarrollo)

```yaml
version: '3.8'

services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:15-alpine
    container_name: sistema-gestion-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-sistema_gestion}
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-postgres}
      POSTGRES_INITDB_ARGS: "-E UTF8 --locale=es_AR.UTF-8"
      TZ: America/Argentina/Buenos_Aires
    ports:
      - "${DATABASE_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    networks:
      - sistema-gestion-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # PgAdmin (opcional - solo desarrollo)
  # ============================================
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: sistema-gestion-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@admin.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
      PGADMIN_LISTEN_PORT: 80
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - sistema-gestion-network
    depends_on:
      - postgres
    profiles:
      - tools

  # ============================================
  # Redis (para caché y sessions - opcional)
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: sistema-gestion-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    networks:
      - sistema-gestion-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    profiles:
      - with-redis

  # ============================================
  # Backend NestJS (Development)
  # ============================================
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.dev
      args:
        NODE_VERSION: 20-alpine
    container_name: sistema-gestion-backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: ${BACKEND_PORT:-3000}
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ${DATABASE_USER:-postgres}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-postgres}
      DATABASE_NAME: ${DATABASE_NAME:-sistema_gestion}
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-this}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5173}
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "${BACKEND_PORT:-3000}:3000"
    volumes:
      - ./apps/backend:/app
      - /app/node_modules
      - ./packages/shared:/app/packages/shared
    networks:
      - sistema-gestion-network
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run start:dev
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============================================
  # Frontend React (Development)
  # ============================================
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.dev
      args:
        NODE_VERSION: 20-alpine
    container_name: sistema-gestion-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      VITE_API_URL: ${VITE_API_URL:-http://localhost:3000/api}
    ports:
      - "${FRONTEND_PORT:-5173}:5173"
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
      - ./packages/shared:/app/packages/shared
    networks:
      - sistema-gestion-network
    depends_on:
      - backend
    command: npm run dev -- --host 0.0.0.0
    stdin_open: true
    tty: true

  # ============================================
  # Nginx (opcional - para producción)
  # ============================================
  nginx:
    image: nginx:alpine
    container_name: sistema-gestion-nginx
    restart: unless-stopped
    ports:
      - "${NGINX_PORT:-80}:80"
      - "${NGINX_SSL_PORT:-443}:443"
    volumes:
      - ./apps/frontend/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./apps/frontend/dist:/usr/share/nginx/html:ro
    networks:
      - sistema-gestion-network
    depends_on:
      - backend
      - frontend
    profiles:
      - production

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local
  redis_data:
    driver: local

# ============================================
# Networks
# ============================================
networks:
  sistema-gestion-network:
    driver: bridge
```

---

## 2. Backend Dockerfile.dev

```dockerfile
# apps/backend/Dockerfile.dev

FROM node:20-alpine

# Instalar pnpm
RUN npm install -g pnpm

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de desarrollo con hot-reload
CMD ["pnpm", "run", "start:dev"]
```

---

## 3. Backend Dockerfile (Producción)

```dockerfile
# apps/backend/Dockerfile

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared

# Instalar todas las dependencias (incluyendo dev)
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN pnpm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

# Instalar pnpm
RUN npm install -g pnpm

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copiar archivos de dependencias
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiar build del stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages ./packages

# Cambiar ownership
RUN chown -R nestjs:nodejs /app

# Usar usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/main.js"]
```

---

## 4. Frontend Dockerfile.dev

```dockerfile
# apps/frontend/Dockerfile.dev

FROM node:20-alpine

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install

# Copiar el resto del código
COPY . .

# Exponer puerto de Vite
EXPOSE 5173

# Comando de desarrollo
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## 5. Frontend Dockerfile (Producción)

```dockerfile
# apps/frontend/Dockerfile

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Variables de entorno de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build de producción
RUN pnpm run build

# ============================================
# Stage 2: Production con Nginx
# ============================================
FROM nginx:alpine AS production

# Copiar build de React
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Nginx en foreground
CMD ["nginx", "-g", "daemon off;"]
```

---

## 6. nginx.conf (Frontend)

```nginx
# apps/frontend/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Frontend
        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        # Static assets con cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Proxy para API
        location /api/ {
            proxy_pass http://backend:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 7. .dockerignore (Backend)

```
# apps/backend/.dockerignore

# Dependencies
node_modules
npm-debug.log
pnpm-lock.yaml
package-lock.json
yarn.lock

# Build output
dist
build
.next

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# Testing
coverage
.nyc_output

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Docs
*.md
!README.md

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore
```

---

## 8. .dockerignore (Frontend)

```
# apps/frontend/.dockerignore

# Dependencies
node_modules
npm-debug.log
pnpm-lock.yaml
package-lock.json
yarn.lock

# Build output
dist
build
.next

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# Testing
coverage

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Docs
*.md
!README.md

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore
```

---

## 9. scripts/init-db.sh

```bash
#!/bin/bash
# scripts/init-db.sh

set -e

echo "🚀 Inicializando base de datos..."

# Crear extensiones necesarias
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Extensión para UUID
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Extensión para funciones de texto
    CREATE EXTENSION IF NOT EXISTS "unaccent";
    
    -- Configurar timezone
    SET timezone = 'America/Argentina/Buenos_Aires';
    
    -- Mensaje de confirmación
    SELECT 'Base de datos inicializada correctamente' AS status;
EOSQL

echo "✅ Base de datos inicializada correctamente"
```

---

## 10. .env.example (Root)

```env
# ============================================
# GENERAL
# ============================================
NODE_ENV=development
TZ=America/Argentina/Buenos_Aires

# ============================================
# DATABASE
# ============================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=sistema_gestion

# ============================================
# BACKEND
# ============================================
BACKEND_PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# ============================================
# FRONTEND
# ============================================
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:5173

# ============================================
# PGADMIN (opcional)
# ============================================
PGADMIN_PORT=5050
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin

# ============================================
# REDIS (opcional)
# ============================================
REDIS_PORT=6379
REDIS_HOST=localhost

# ============================================
# NGINX (producción)
# ============================================
NGINX_PORT=80
NGINX_SSL_PORT=443
```

---

## 11. Makefile (Comandos útiles)

```makefile
# Makefile

.PHONY: help

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# DESARROLLO
# ============================================

dev: ## Iniciar entorno de desarrollo completo
	docker-compose up -d

dev-logs: ## Ver logs de desarrollo
	docker-compose logs -f

dev-down: ## Detener entorno de desarrollo
	docker-compose down

dev-restart: ## Reiniciar entorno de desarrollo
	docker-compose restart

# ============================================
# BASE DE DATOS
# ============================================

db-up: ## Iniciar solo PostgreSQL
	docker-compose up -d postgres

db-shell: ## Conectar a shell de PostgreSQL
	docker-compose exec postgres psql -U postgres -d sistema_gestion

db-reset: ## Resetear base de datos (¡CUIDADO!)
	docker-compose down -v
	docker-compose up -d postgres
	sleep 5
	docker-compose exec backend npm run migration:run

db-backup: ## Backup de base de datos
	docker-compose exec -T postgres pg_dump -U postgres sistema_gestion > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore: ## Restaurar backup (uso: make db-restore FILE=backup.sql)
	docker-compose exec -T postgres psql -U postgres sistema_gestion < $(FILE)

# ============================================
# PGADMIN
# ============================================

pgadmin: ## Iniciar PgAdmin
	docker-compose --profile tools up -d pgadmin
	@echo "PgAdmin disponible en: http://localhost:5050"
	@echo "Email: admin@admin.com"
	@echo "Password: admin"

# ============================================
# BACKEND
# ============================================

backend-logs: ## Ver logs del backend
	docker-compose logs -f backend

backend-shell: ## Shell del contenedor backend
	docker-compose exec backend sh

backend-restart: ## Reiniciar backend
	docker-compose restart backend

migration-generate: ## Generar migración (uso: make migration-generate NAME=MiMigracion)
	docker-compose exec backend npm run migration:generate -- src/migrations/$(NAME)

migration-run: ## Ejecutar migraciones
	docker-compose exec backend npm run migration:run

migration-revert: ## Revertir última migración
	docker-compose exec backend npm run migration:revert

# ============================================
# FRONTEND
# ============================================

frontend-logs: ## Ver logs del frontend
	docker-compose logs -f frontend

frontend-shell: ## Shell del contenedor frontend
	docker-compose exec frontend sh

frontend-restart: ## Reiniciar frontend
	docker-compose restart frontend

# ============================================
# LIMPIEZA
# ============================================

clean: ## Limpiar contenedores y volúmenes
	docker-compose down -v
	docker system prune -f

clean-all: ## Limpieza profunda (¡CUIDADO!)
	docker-compose down -v --rmi all
	docker system prune -af --volumes

# ============================================
# BUILD
# ============================================

build: ## Build de todas las imágenes
	docker-compose build

build-backend: ## Build solo backend
	docker-compose build backend

build-frontend: ## Build solo frontend
	docker-compose build frontend

# ============================================
# PRODUCCIÓN
# ============================================

prod-up: ## Iniciar en modo producción
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Detener modo producción
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-logs: ## Ver logs de producción
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# ============================================
# TESTING
# ============================================

test: ## Ejecutar tests
	docker-compose exec backend npm run test

test-watch: ## Tests en modo watch
	docker-compose exec backend npm run test:watch

test-cov: ## Tests con coverage
	docker-compose exec backend npm run test:cov

# ============================================
# UTILS
# ============================================

ps: ## Ver contenedores en ejecución
	docker-compose ps

stats: ## Ver estadísticas de recursos
	docker stats

install: ## Instalar dependencias
	docker-compose exec backend pnpm install
	docker-compose exec frontend pnpm install
```

---

## 12. Comandos Rápidos

### Desarrollo diario:

```bash
# Iniciar todo
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver solo logs del backend
docker-compose logs -f backend

# Ver solo logs del frontend
docker-compose logs -f frontend

# Detener todo
docker-compose down

# Reiniciar un servicio
docker-compose restart backend
```

### Base de datos:

```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d sistema_gestion

# Ejecutar migraciones
docker-compose exec backend npm run migration:run

# Generar migración
docker-compose exec backend npm run migration:generate -- src/migrations/NombreMigracion

# Backup
docker-compose exec postgres pg_dump -U postgres sistema_gestion > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres sistema_gestion < backup.sql
```

### PgAdmin:

```bash
# Iniciar PgAdmin
docker-compose --profile tools up -d pgadmin

# Acceder: http://localhost:5050
# Email: admin@admin.com
# Password: admin
```

### Limpieza:

```bash
# Detener y eliminar volúmenes
docker-compose down -v

# Limpieza profunda
docker system prune -af --volumes
```

---

## 13. Troubleshooting

### Problema: Puerto ocupado

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :5173
lsof -i :5432

# Matar proceso
kill -9 <PID>
```

### Problema: Contenedor no inicia

```bash
# Ver logs del contenedor
docker-compose logs backend

# Reconstruir imagen
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Problema: Base de datos no se conecta

```bash
# Verificar que postgres esté corriendo
docker-compose ps postgres

# Verificar health check
docker inspect sistema-gestion-db | grep Health -A 10

# Reiniciar postgres
docker-compose restart postgres
```

---

**¡Configuración Docker completa lista para usar!** 🐳✨
