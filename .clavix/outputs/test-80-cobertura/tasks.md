# Implementation Plan

**Project**: sistema-gestion
**Generated**: 2026-01-19T17:08:00Z

## Technical Context & Standards
*Detected Stack & Patterns*
- **Architecture**: Monorepo con Turbo (apps/backend, apps/frontend)
- **Backend**: NestJS con TypeORM, TypeScipt, Jest para testing
- **Frontend**: React 18 con Vite, TypeScript, Vitest, Playwright para E2E
- **Testing**: Pyramide de tests (unitarios, integración, E2E, smoke tests)
- **Conventions**: Tests junto al código (*.spec.ts), factories para test data
- **Coverage**: Threshold actual 70% global, objetivo 80%

---

## Phase 1: Análisis y Preparación

- [x] **Analizar estado actual de cobertura** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-1-analysis-01
  > **Implementation**: Ejecutar `npm run test:all` con reporte de cobertura detallado
  > **Details**: Generar baseline de cobertura actual identificando módulos con <70% coverage. Usar `--coverage --coverage-reporters=text --coverage-reporters=lcov` para análisis detallado.

- [x] **Configurar SonarQube local para desarrollo** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-1-analysis-02
  > **Implementation**: Configurar acceso local a SonarQube usando docker-compose.sonarqube.yml
  > **Details**: Iniciar SonarQube local, verificar credenciales, y configurar projectKey para análisis incremental sin depender de servidor remoto.

---

## Phase 1.5: Smoke Tests (Validación Básica Rápida)

- [x] **Crear smoke tests para endpoints de health check** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-1-smoke-01
  > **Implementation**: Crear `apps/backend/src/health/health.controller.spec.ts`
  > **Details**: Probar endpoints de health check (/health, /health/liveness, /health/readiness) sin dependencias externas. Validar respuestas 200 y estructura básica.

- [x] **Crear smoke tests para API básica sin autenticación** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-1-smoke-02
  > **Implementation**: Crear `apps/backend/src/smoke-api.spec.ts`
  > **Details**: Probar endpoints públicos: auth/login, auth/refresh, productos básicos. Validar que la API responde con estructura correcta antes de tests complejos.

- [x] **Crear smoke tests para build y despliegue** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-1-smoke-03
  > **Implementation**: Crear `apps/frontend/src/smoke-build.spec.ts`
  > **Details**: Validar que la aplicación frontend se construye correctamente, tiene las rutas principales, y los componentes básicos renderizan sin crash.

---

## Phase 2: Tests Críticos Backend (Mayor Impacto)

- [x] **Crear tests para AuthService - login y registro** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-2-auth-critical-01
  > **Implementation**: Crear `apps/backend/src/modules/auth/auth.service.spec.ts`
  > **Details**: Testear escenarios de login exitoso/fracaso, validación de credenciales, manejo de excepciones, y auditoría de intentos fallidos. Usar factories para crear usuarios de prueba.

- [x] **Crear tests para CashRegisterService - operaciones básicas** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-2-cash-register-critical-01
  > **Implementation**: Crear `apps/backend/src/modules/cash-register/cash-register.service.spec.ts`
  > **Details**: Testear apertura/cierre de caja, cálculo de saldos, manejo de excepciones. Mockear repositorios y probar flujos completos con datos realistas.

- [x] **Crear tests para SalesService - creación de ventas** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-2-sales-critical-01
  > **Implementation**: Crear `apps/backend/src/modules/sales/sales.service.spec.ts`
  > **Details**: Testear creación de ventas con múltiples items, cálculo de totales, aplicación de impuestos, y generación de facturas. Cubrir casos edge como stock insuficiente.

- [x] **Crear tests para PurchasesService - registro de compras** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-2-purchases-critical-01
  > **Implementation**: Crear `apps/backend/src/modules/purchases/purchases.service.spec.ts`
  > **Details**: Testear registro de compras, actualización de stock, validación de proveedores, y manejo de costos. Incluir tests para diferentes métodos de pago.

---

## Phase 3: Tests de Integración Backend

- [ ] **Crear test de integración para flujo de ventas completo** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-3-integration-sales-01
  > **Implementation**: Crear `apps/backend/test/integration/sales-flow.spec.ts`
  > **Details**: Probar flujo completo: cliente → productos → venta → pago → actualización stock → generación factura. Usar BD real con datos de prueba aislados.

- [ ] **Crear test de integración para flujo de caja** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-3-integration-cash-01
  > **Implementation**: Crear `apps/backend/test/integration/cash-register-flow.spec.ts`
  > **Details**: Probar apertura de caja, registro de ventas, ingresos, egresos, y cierre de caja con reconciliación. Validar cálculos de totales y movimientos.

- [ ] **Crear test de integración para auth con JWT** (ref: docs/testing/planificacion-test-80%.md)
  Task ID: phase-3-integration-auth-01
  > **Implementation**: Crear `apps/backend/test/integration/jwt-auth.spec.ts`
  > **Details**: Probar generación/validación de tokens, renovación de refresh tokens, manejo de expiración, y seguridad de endpoints protegidos.

---

## Phase 4: Tests Unitarios Frontend (Alto Impacto)

- [x] **Configurar Vitest para frontend** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-4-frontend-setup-01
  > **Implementation**: Crear `apps/frontend/vitest.config.ts` y actualizar package.json
  > **Details**: Configurar entorno de testing con Vitest, definir coverage reporters, y setup básico para tests unitarios. Excluir carpetas de producción.

- [x] **Crear tests para hooks de autenticación** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-4-frontend-auth-01
  > **Implementation**: Crear `apps/frontend/src/features/auth/hooks/useAuth.test.ts`
  > **Details**: Testear login, logout, manejo de tokens, persistencia de sesión, y redirecciones. Mockear axios y localStorage.

- [x] **Crear tests para componentes de SalesForm** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-4-frontend-sales-01
  > **Implementation**: Crear `apps/frontend/src/features/sales/components/SaleForm.test.tsx`
  > **Details**: Testear adición/removal de items, cálculo de totales en tiempo real, validación de stock, y envío de formulario. Usar React Testing Library.

- [x] **Crear tests para Dashboard metrics** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-4-frontend-dashboard-01
  > **Implementation**: Crear `apps/frontend/src/components/Dashboard/Metrics.test.tsx`
  > **Details**: Testear fetching de datos, cálculo de KPIs, manejo de loading states, y actualización en tiempo real. Mockear API calls.

---

## Phase 5: Tests E2E Frontend

- [x] **Crear test E2E para flujo de ventas** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-5-e2e-sales-01
  > **Implementation**: Crear `apps/frontend/e2e/tests/sales-flow.spec.ts`
  > **Details**: Probar flujo completo de venta: login → selección productos → cálculo total → método de pago → confirmación → verificación en dashboard.

- [x] **Crear test E2E para gestión de productos** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-5-e2e-products-01
  > **Implementation**: Crear `apps/frontend/e2e/tests/products.spec.ts`
  > **Details**: Probar CRUD completo: crear producto → editar stock → actualizar precio → verificar en lista → eliminar (si aplica).

- [x] **Crear test E2E para flujo de caja** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-5-e2e-cash-01
  > **Implementation**: Crear `apps/frontend/e2e/tests/cash-register.spec.ts`
  > **Details**: Probar apertura de caja → registro de ventas → ingresos/egresos → cierre y reconciliación. Validar alertas y notificaciones.

---

## Phase 6: Tests de Regresión con Smoke Tests

- [x] **Crear test smoke para flujo crítico después de deployment** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-6-smoke-01
  > **Implementation**: Crear `apps/frontend/e2e/tests/smoke-critical-flows.spec.ts`
  > **Details**: Probar los flujos más críticos después de cada deployment: login → dashboard → crear venta básica. Tiempo de ejecución < 30 segundos.

- [x] **Crear test smoke para monitoreo continuo** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-6-smoke-02
  > **Implementation**: Crear `apps/backend/test/api/smoke-monitoring.spec.ts`
  > **Details**: Tests rápidos para monitor: health check, login estándar, respuesta de productos. Usar en pipelines CI para detectar problemas rápidamente.

- [x] **Crear test smoke para performance básica** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-6-smoke-03
  > **Implementation**: Crear `apps/backend/test/performance/smoke-performance.spec.ts`
  > **Details**: Validar tiempos de respuesta básicos (< 2s para endpoints críticos, < 500ms para health check). Identificar regresiones de performance.

---

## Phase 7: Optimización y Validación

- [ ] **Ejecutar Sonar scan completo** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-7-validation-01
  > **Implementation**: Ejecutar `npm run sonar:local` después de todos los tests
  > **Details**: Verificar que cobertura supera 80%. Analizar issues restantes y priorizar si es necesario ejecutar tests adicionales.

- [x] **Documentar archivos imposibles de testear** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-7-validation-02
  > **Implementation**: Crear `docs/testing/files-not-testable.md`
  > **Details**: Documentar archivos de configuración, DTOs, enums, y otros que por su naturaleza no requieren testing pero afectan métricas.

- [x] **Crear script de ejecución rápida de smoke tests** (ref: docs/testing/planificación-test-80%.md)
  Task ID: phase-7-validation-03
  > **Implementation**: Crear script `scripts/run-smoke-tests.sh`
  > **Details**: Script ejecutable en < 10 segundos para validar estado básico antes de deployments. Incluir health checks, login básico y respuesta de endpoints críticos.

---

*Generated by Clavix /clavix:plan*