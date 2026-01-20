# Script de ejecución rápida de smoke tests para Windows
# Valida el estado básico del sistema antes de deployments
# Tiempo objetivo: < 10 segundos

$ErrorActionPreference = "Stop"

Write-Host "🔥 Ejecutando Smoke Tests..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$Passed = 0
$Failed = 0
$Total = 0

function Test-Smoke {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    $Total++
    Write-Host -NoNewline "⚡ $Name... "

    try {
        & $Command > $null 2>&1
        Write-Host "PASS" -ForegroundColor Green
        $Passed++
        return $true
    } catch {
        Write-Host "FAIL" -ForegroundColor Red
        $Failed++
        return $false
    }
}

# 1. Backend Health Check
Write-Host ""
Write-Host "📦 Backend:" -ForegroundColor Yellow
Test-Smoke "Health check endpoint" { curl -UseBasicParsing -Uri "http://localhost:3000/health" -Method Head }
Test-Smoke "API responde" { curl -UseBasicParsing -Uri "http://localhost:3000/" -Method Head }

# 2. Base de Datos
Write-Host ""
Write-Host "🗄️  Base de Datos:" -ForegroundColor Yellow
# Verificar que PostgreSQL está corriendo
Test-Smoke "PostgreSQL accesible" {
    $env:PGPASSWORD = "491467Aguxd!"
    psql -h localhost -U postgres -c "SELECT 1" -q
}

# 3. Frontend
Write-Host ""
Write-Host "🌐 Frontend:" -ForegroundColor Yellow
Test-Smoke "Frontend responde" { curl -UseBasicParsing -Uri "http://localhost:5173" -Method Head }

# 4. Build
Write-Host ""
Write-Host "🔨 Build:" -ForegroundColor Yellow
# Verificar que TypeScript compila sin errores
Test-Smoke "Backend compila" { Push-Location apps/backend; npx tsc --noEmit; Pop-Location }
Test-Smoke "Frontend compila" { Push-Location apps/frontend; npx tsc --noEmit; Pop-Location }

# 5. Tests unitarios críticos
Write-Host ""
Write-Host "🧪 Tests Unitarios Críticos:" -ForegroundColor Yellow
Test-Smoke "AuthService tests" {
    Push-Location apps/backend
    npm run test -- --testPathPattern=auth.service.spec --silent
    Pop-Location
}
Test-Smoke "AppController smoke tests" {
    Push-Location apps/backend
    npm run test -- --testPathPattern=app.controller.spec --silent
    Pop-Location
}

# Resumen
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Resultados: $Passed/$Total tests pasaron"

if ($Failed -gt 0) {
    Write-Host "❌ $Failed test(s) fallaron" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Smoke tests fallaron. No se recomienda hacer deployment." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Todos los smoke tests pasaron" -ForegroundColor Green
    Write-Host ""
    Write-Host "✨ Sistema listo para deployment" -ForegroundColor Cyan
    exit 0
}
