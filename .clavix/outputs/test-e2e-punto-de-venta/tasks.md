# Implementation Plan

**Project**: test-e2e-punto-de-venta
**Generated**: 2026-01-16T00:00:00Z

## Technical Context & Standards
*Detected Stack & Patterns*
- **Architecture**: Monorepo, monolito por app (frontend/backend/desktop)
- **Framework**: React + Vite (frontend), NestJS + TypeORM (backend), Electron (desktop)
- **Styling**: Tailwind CSS + Radix UI components (`apps/frontend/src/components/ui`)
- **State**: Zustand (`apps/frontend/src/stores`) + React Query
- **API**: Axios wrapper en `apps/frontend/src/lib/axios.ts`
- **Conventions**: TypeScript strict, sin `any`, tests backend con Jest, E2E frontend con Playwright

---

## Phase 1: Base de pruebas y utilidades

- [x] **Ampliar factories de test para dominios críticos** (ref: Requirements / Must-Have Features)
  Task ID: phase-1-base-de-pruebas-01
  > **Implementation**: Create `apps/backend/test/factories/cash-register.factory.ts`, `apps/backend/test/factories/customer-account.factory.ts`, `apps/backend/test/factories/income.factory.ts`, `apps/backend/test/factories/expense.factory.ts`.
  > **Details**: Exportar DTOs realistas para caja, cuenta corriente, ingresos y gastos. Actualizar `apps/backend/test/factories/index.ts` para re-exportar.

- [x] **Extender helpers E2E para flujos comunes** (ref: Requirements / Must-Have Features)
  Task ID: phase-1-base-de-pruebas-02
  > **Implementation**: Edit `apps/frontend/e2e/fixtures/test-fixtures.ts`.
  > **Details**: Agregar helpers para abrir caja, crear cliente, registrar ingreso/gasto y confirmar venta on-account usando UI. Mantener tipos explícitos y reutilizar `TestHelpers`.

- [x] **Crear utilidades de datos de prueba para Playwright** (ref: Requirements / Must-Have Features)
  Task ID: phase-1-base-de-pruebas-03
  > **Implementation**: Create `apps/frontend/e2e/fixtures/test-data.ts`.
  > **Details**: Centralizar datos de clientes, productos, caja e importes, evitando duplicación en specs. Exportar constantes tipadas.

---

## Phase 2: Unit tests backend (60%)

- [x] **Cobertura unitaria de caja** (ref: Requirements / Must-Have Features)
  Task ID: phase-2-unit-backend-01
  > **Implementation**: Create `apps/backend/src/modules/cash-register/cash-register.service.spec.ts`.
  > **Details**: Testear apertura/cierre, validación de caja abierta, movimientos manuales y balances. Mockear repositorios con `getRepositoryToken`.

- [x] **Cobertura unitaria de cuenta corriente** (ref: Requirements / Must-Have Features)
  Task ID: phase-2-unit-backend-02
  > **Implementation**: Create `apps/backend/src/modules/customer-accounts/customer-accounts.service.spec.ts`.
  > **Details**: Verificar creación de cargos, registro de pagos, actualización de saldo y validaciones de cliente.

- [x] **Cobertura unitaria de ingresos** (ref: Requirements / Must-Have Features)
  Task ID: phase-2-unit-backend-03
  > **Implementation**: Create `apps/backend/src/modules/incomes/incomes.service.spec.ts`.
  > **Details**: Testear creación/actualización, categorías y validaciones de fechas/montos.

- [x] **Cobertura unitaria de gastos** (ref: Requirements / Must-Have Features)
  Task ID: phase-2-unit-backend-04
  > **Implementation**: Create `apps/backend/src/modules/expenses/expenses.service.spec.ts`.
  > **Details**: Testear creación/actualización, categorías, marcado como pagado y validaciones de monto.

- [x] **Completar unit tests de ventas con flujos críticos** (ref: Requirements / Must-Have Features)
  Task ID: phase-2-unit-backend-05
  > **Implementation**: Edit `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Agregar casos para ventas con caja abierta, ventas a cuenta corriente, generación de comprobante y efecto sobre stock/caja (mockeando servicios dependientes).

---

## Phase 3: Integration tests backend (30%)

- [x] **Configurar carpeta de integración y primer spec** (ref: Requirements / Must-Have Features)
  Task ID: phase-3-integration-backend-01
  > **Implementation**: Create `apps/backend/test/integration/sales-cash-register.integration.spec.ts`.
  > **Details**: Usar `test/setup-integration.ts` y `testDataSource` para validar venta + movimiento de caja + movimiento de stock con DB real.

- [x] **Integración de cuenta corriente** (ref: Requirements / Must-Have Features)
  Task ID: phase-3-integration-backend-02
  > **Implementation**: Create `apps/backend/test/integration/customer-accounts.integration.spec.ts`.
  > **Details**: Validar cargo por venta a cuenta corriente, pago parcial y actualización de saldo con repositorios reales.

- [x] **Integración ingresos/gastos** (ref: Requirements / Must-Have Features)
  Task ID: phase-3-integration-backend-03
  > **Implementation**: Create `apps/backend/test/integration/incomes-expenses.integration.spec.ts`.
  > **Details**: Crear ingresos y gastos y verificar persistencia, filtros por fecha y efecto en reportes si aplica.

---

## Phase 4: E2E frontend (10%)

- [x] **E2E de cuenta corriente** (ref: Requirements / Must-Have Features)
  Task ID: phase-4-e2e-frontend-01
  > **Implementation**: Create `apps/frontend/e2e/tests/customer-accounts.spec.ts`.
  > **Details**: Flujos de ver cuenta corriente, registrar pago, y abrir detalle de movimientos. Reutilizar helpers y datos en fixtures.

- [x] **E2E de ingresos** (ref: Requirements / Must-Have Features)
  Task ID: phase-4-e2e-frontend-02
  > **Implementation**: Create `apps/frontend/e2e/tests/incomes.spec.ts`.
  > **Details**: Crear ingreso, verificar listado y stats; validar mensajes de éxito.

- [x] **Refuerzo E2E de caja y gastos** (ref: Requirements / Must-Have Features)
  Task ID: phase-4-e2e-frontend-03
  > **Implementation**: Edit `apps/frontend/e2e/tests/cash-register.spec.ts` and `apps/frontend/e2e/tests/expenses.spec.ts`.
  > **Details**: Asegurar flujo completo apertura/cierre, movimiento manual y registrar gasto/mark-as-paid con asserts visibles.

- [x] **Refuerzo E2E de ventas críticas** (ref: Requirements / Must-Have Features)
  Task ID: phase-4-e2e-frontend-04
  > **Implementation**: Edit `apps/frontend/e2e/tests/sales.spec.ts`.
  > **Details**: Agregar caso de venta a cuenta corriente con cliente y validar confirmación + actualización del listado.

---

*Generated by Clavix /clavix-plan*
