# Script de Setup Inicial - Sistema de Gestión
# Este script facilita la configuración inicial del proyecto

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Sistema de Gestión - Setup Inicial" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si existe pnpm
Write-Host "[1/5] Verificando pnpm..." -ForegroundColor Yellow
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm no está instalado. Instalando..." -ForegroundColor Red
    npm install -g pnpm
    Write-Host "✅ pnpm instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "✅ pnpm ya está instalado" -ForegroundColor Green
}

Write-Host ""

# 2. Crear archivo .env si no existe
Write-Host "[2/5] Configurando variables de entorno..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item "env.template" ".env"
    Write-Host "✅ Archivo .env creado desde env.template" -ForegroundColor Green
    Write-Host "ℹ️  Edita el archivo .env si necesitas cambiar configuraciones" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  El archivo .env ya existe, no se sobrescribe" -ForegroundColor Yellow
}

Write-Host ""

# 3. Instalar dependencias
Write-Host "[3/5] Instalando dependencias del monorepo..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Verificar Docker
Write-Host "[4/5] Verificando Docker..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker está disponible" -ForegroundColor Green
    
    # Verificar si los contenedores ya están corriendo
    $runningContainers = docker-compose ps -q
    if ($runningContainers) {
        Write-Host "ℹ️  Los contenedores Docker ya están corriendo" -ForegroundColor Cyan
    } else {
        Write-Host "🚀 Levantando contenedores de Docker..." -ForegroundColor Yellow
        docker-compose up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Contenedores iniciados correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ Error al iniciar contenedores" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠️  Docker no está instalado. Instálalo para usar PostgreSQL y Redis" -ForegroundColor Yellow
}

Write-Host ""

# 5. Resumen
Write-Host "[5/5] Setup completado!" -ForegroundColor Green
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Próximos pasos:" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Editar el archivo .env si es necesario" -ForegroundColor White
Write-Host "2. Ejecutar: pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Yellow
Write-Host "  - Backend:  http://localhost:3000/api" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs: docker-compose logs -f postgres" -ForegroundColor Gray
Write-Host ""
