#!/bin/bash

# Script de ejecución rápida de smoke tests
# Valida el estado básico del sistema antes de deployments
# Tiempo objetivo: < 10 segundos

set -e

echo "🔥 Ejecutando Smoke Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de tests
PASSED=0
FAILED=0
TOTAL=0

# Función para ejecutar un test smoke
run_smoke_test() {
    local test_name="$1"
    local command="$2"

    TOTAL=$((TOTAL + 1))
    echo -n "⚡ $test_name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. Backend Health Check
echo ""
echo "📦 Backend:"
run_smoke_test "Health check endpoint" "curl -f -s http://localhost:3000/health"
run_smoke_test "API responde" "curl -f -s http://localhost:3000/"

# 2. Base de Datos
echo ""
echo "🗄️  Base de Datos:"
# Verificar que PostgreSQL está corriendo
run_smoke_test "PostgreSQL accesible" "pg_isready -h localhost -p 5432 -U postgres"

# 3. Frontend
echo ""
echo "🌐 Frontend:"
run_smoke_test "Frontend responde" "curl -f -s http://localhost:5173"

# 4. Build
echo ""
echo "🔨 Build:"
# Verificar que TypeScript compila sin errores
run_smoke_test "Backend compila" "cd apps/backend && npx tsc --noEmit"
run_smoke_test "Frontend compila" "cd apps/frontend && npx tsc --noEmit"

# 5. Tests unitarios críticos
echo ""
echo "🧪 Tests Unitarios Críticos:"
run_smoke_test "AuthService tests" "cd apps/backend && npm run test -- --testPathPattern=auth.service.spec --silent"
run_smoke_test "AppController smoke tests" "cd apps/backend && npm run test -- --testPathPattern=app.controller.spec --silent"

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Resultados: $PASSED/$TOTAL tests pasaron"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ $FAILED test(s) fallaron${NC}"
    echo ""
    echo "⚠️  Smoke tests fallaron. No se recomienda hacer deployment."
    exit 1
else
    echo -e "${GREEN}✅ Todos los smoke tests pasaron${NC}"
    echo ""
    echo "✨ Sistema listo para deployment"
    exit 0
fi
