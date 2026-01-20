# Implementation Plan

**Project**: customer-accounts-tests
**Generated**: 2025-01-20T12:00:00Z
**Objective**: Alcanzar >= 90% de cobertura de tests en el módulo de Cuentas Corrientes

---

## Technical Context & Standards

**Detected Stack & Patterns:**
- **Framework**: NestJS 10 with TypeScript
- **Testing**: Jest con ts-jest (3 proyectos: unit, integration, api)
- **ORM**: TypeORM con PostgreSQL
- **Patterns**:
  - Unit tests: junto al código fuente (`*.spec.ts`)
  - Integration tests: `test/integration/**/*.spec.ts`
  - API tests: `test/api/**/*.spec.ts`
  - Factories: `test/factories/*.factory.ts`
  - Setup files: `test/setup.ts`, `test/setup-integration.ts`, `test/setup-api.ts`
- **Service Under Test**: `CustomerAccountsService` (~850 líneas)
- **Controller Under Test**: `CustomerAccountsController` (~210 líneas)
- **Current State**: Tests existentes están skippeados por problemas de memoria

---

## Phase 1: Diagnóstico y Preparación

- [ ] **Ejecutar cobertura actual para identificar gaps** (ref: baseline)
  Task ID: phase-1-diagnostic-01
  > **Implementation**: Ejecutar `npm run test:all -- --coverage --collectCoverageFrom='src/modules/customer-accounts/**'`
  > **Details**: Guardar reporte en `coverage/customer-accounts-baseline.txt`. Esto nos dará el % actual y qué líneas/ramas no están cubiertas.

- [ ] **Arreglar problema de memoria en tests unitarios existentes** (ref: fix-memory)
  Task ID: phase-1-fix-memory-02
  > **Implementation**: Editar `apps/backend/src/modules/customer-accounts/customer-accounts.service.spec.ts`
  > **Details**: Remover el `describe.skip` y arreglar el problema de memoria que causó el skip. Posible causa: mocks mal configurados o falta de cleanup en `afterEach`.

---

## Phase 2: Unit Tests - CustomerAccountsService

**Objetivo**: Cubrir todos los métodos del servicio con edge cases

- [ ] **Completar tests para getOrCreateAccount** (ref: service-getOrCreate)
  Task ID: phase-2-unit-01
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Agregar tests para:
  > - Cuenta existente con customer relacionado
  > - Creación de nueva cuenta cuando no existe
  > - Error cuando cliente no existe (ya existe)
  > - Verificar que `paymentTermDays` default = 30

- [ ] **Completar tests para createCharge** (ref: service-createCharge)
  Task ID: phase-2-unit-02
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Agregar tests faltantes:
  > - Cargo con saleId (referencia a venta)
  > - Cargo con notes
  > - Límite de crédito exacto (boundary test)
  > - Monto negativo se convierte a positivo
  > - Verificar actualización de `lastPurchaseDate`

- [ ] **Completar tests para createPayment** (ref: service-createPayment)
  Task ID: phase-2-unit-03
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Agregar tests faltantes:
  > - Pago parcial (balanceAfter > 0)
  > - Pago sin description (usa default)
  > - Pago con cashRegisterService fallando (warning, no error)
  > - Verificar reset de `daysOverdue` en pago total
  > - Verificar reactivación de cuenta SUSPENDED -> ACTIVE
  > - Actualización de ventas e ingresos pendientes

- [ ] **Completar tests para applySurcharge** (ref: service-applySurcharge)
  Task ID: phase-2-unit-04
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Agregar tests faltantes:
  > - Recargo porcentual con descripción custom
  > - Recargo fijo con descripción custom
  > - Verificar cálculo correcto del porcentaje (redondeo a 2 decimales)
  > - Error cuando balance = 0
  > - Error cuando balance < 0 (saldo a favor)

- [ ] **Completar tests para createAdjustment** (ref: service-createAdjustment)
  Task ID: phase-2-unit-05
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Agregar tests faltantes:
  > - Ajuste con referenceType y referenceId
  > - Ajuste con notes
  > - Ajuste deja saldo en negativo (business_owes)
  > - Verificar console.log se ejecuta

- [ ] **Completar tests para getAccountStatement** (ref: service-getStatement)
  Task ID: phase-2-unit-06
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Crear tests nuevos (no existen):
  > - Paginación page 1, limit 50 (default)
  > - Paginación page 2, limit 20
  > - Límite máximo de 100 (boundary test)
  > - Calcular totales: totalCharges, totalPayments
  > - customerPosition: 'customer_owes' cuando balance > 0
  > - customerPosition: 'business_owes' cuando balance < 0
  > - customerPosition: 'settled' cuando balance = 0
  > - Retornar movimientos con relaciones (createdBy, paymentMethod)

- [ ] **Completar tests para findAll** (ref: service-findAll)
  Task ID: phase-2-unit-07
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Crear tests nuevos:
  > - Filtro por status = 'active'
  > - Filtro por status = 'suspended'
  > - Filtro hasDebt = true (balance > 0)
  > - Filtro isOverdue = true (daysOverdue > 0)
  > - Búsqueda por nombre de cliente (search param)
  > - Paginación correcta (page, limit, totalPages)

- [ ] **Completar tests para getDebtors** (ref: service-getDebtors)
  Task ID: phase-2-unit-08
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Tests ya existen pero verify coverage:
  > - Solo retorna cuentas con balance > 0
  > - Ordenadas por balance DESC
  > - Incluye relación customer

- [ ] **Completar tests para getStats** (ref: service-getStats)
  Task ID: phase-2-unit-09
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Tests ya existen pero agregar:
  > - Cálculo de averageDebt cuando totalDebtors = 0
  > - Todos los campos retornados

- [ ] **Completar tests para getOverdueAlerts** (ref: service-getOverdueAlerts)
  Task ID: phase-2-unit-10
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Crear tests nuevos:
  > - Retorna cuentas con balance > 0 y daysOverdue > 0
  > - Ordenadas por daysOverdue DESC
  > - Formato correcto de customerName
  > - Incluye lastPaymentDate (puede ser null)

- [ ] **Completar tests para getPendingTransactions** (ref: service-getPending)
  Task ID: phase-2-unit-11
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Crear tests nuevos:
  > - Retorna ventas con status PENDING y isOnAccount = true
  > - Retorna ingresos con isPaid = false y isOnAccount = true
  > - Incluye relaciones: items, product, customer, category
  > - Ordenado por fecha DESC

- [ ] **Completar tests para syncMissingCharges** (ref: service-syncCharges)
  Task ID: phase-2-unit-12
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Crear tests nuevos:
  > - No hace nada si no hay ventas faltantes
  > - Sincroniza ventas sin cargo registrado
  > - Crea movimientos en orden cronológico (saleDate ASC)
  > - Actualiza saldo final correctamente
  > - Retorna lista de sales sincronizadas con montos
  > - Verifica console.log con resumen

- [ ] **Tests para métodos @Cron (updateOverdueDays, checkOverdueAccountsMonthly)** (ref: service-cron)
  Task ID: phase-2-unit-13
  > **Implementation**: Editar `customer-accounts.service.spec.ts`
  > **Details**: Crear tests nuevos:
  > - updateOverdueDays: ejecuta SQL bulk update
  > - updateOverdueDays: calcula días considerando paymentTermDays
  > - updateOverdueDays: suspende cuentas con mora > 30 días
  > - checkOverdueAccountsMonthly: llama getOverdueAlerts y loguea

---

## Phase 3: Unit Tests - CustomerAccountsController

- [ ] **Tests para findAll endpoint** (ref: controller-findAll)
  Task ID: phase-3-controller-01
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - GET /customer-accounts con AccountFiltersDto
  > - Filtro por status, hasDebt, isOverdue, search
  > - Filtro por page y limit

- [ ] **Tests para getStats endpoint** (ref: controller-stats)
  Task ID: phase-3-controller-02
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - GET /customer-accounts/stats retorna AccountStats

- [ ] **Tests para getDebtors endpoint** (ref: controller-debtors)
  Task ID: phase-3-controller-03
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - GET /customer-accounts/debtors retorna lista

- [ ] **Tests para getOverdueAlerts endpoint** (ref: controller-overdue)
  Task ID: phase-3-controller-04
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - GET /customer-accounts/overdue-alerts retorna alertas

- [ ] **Tests para getPendingTransactions endpoint** (ref: controller-pending)
  Task ID: phase-3-controller-05
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - GET /customer-accounts/:customerId/pending-transactions
  > - Retorna ventas e incomes pendientes

- [ ] **Tests para getAccountStatement endpoint** (ref: controller-statement)
  Task ID: phase-3-controller-06
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - GET /customer-accounts/:customerId con paginación
  > - page default = 1, limit default = 50
  > - limit máximo = 100

- [ ] **Tests para createCharge endpoint** (ref: controller-charge)
  Task ID: phase-3-controller-07
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - POST /customer-accounts/:customerId/charges
  > - Extrae userId de req.user
  > - Llama servicio con DTO correcto
  > - Error 400 si excede límite

- [ ] **Tests para createPayment endpoint** (ref: controller-payment)
  Task ID: phase-3-controller-08
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - POST /customer-accounts/:customerId/payments
  > - Extrae userId de req.user
  > - Llama servicio con DTO correcto

- [ ] **Tests para applySurcharge endpoint** (ref: controller-surcharge)
  Task ID: phase-3-controller-09
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - POST /customer-accounts/:customerId/surcharge
  > - Usa ApplySurchargeDto (surchargeType, value, description?)

- [ ] **Tests para updateAccount endpoint** (ref: controller-update)
  Task ID: phase-3-controller-10
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - PATCH /customer-accounts/:customerId
  > - Actualiza creditLimit y/o status

- [ ] **Tests para suspendAccount endpoint** (ref: controller-suspend)
  Task ID: phase-3-controller-11
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - POST /customer-accounts/:customerId/suspend

- [ ] **Tests para activateAccount endpoint** (ref: controller-activate)
  Task ID: phase-3-controller-12
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - POST /customer-accounts/:customerId/activate

- [ ] **Tests para syncMissingCharges endpoint** (ref: controller-sync)
  Task ID: phase-3-controller-13
  > **Implementation**: Crear `customer-accounts.controller.spec.ts`
  > **Details**: Tests:
  > - POST /customer-accounts/:customerId/sync-charges
  > - Extrae userId de req.user

---

## Phase 4: Integration Tests

- [ ] **Tests de integración para flujo completo** (ref: integration-full)
  Task ID: phase-4-integration-01
  > **Implementation**: Editar `test/integration/customer-accounts.integration.spec.ts`
  > **Details**: Expandir tests existentes:
  > - Crear cuenta desde cero
  > - Registrar múltiples cargos
  > - Registrar pagos parciales
  > - Verificar saldo final correcto
  > - Verificar secuencia de balances en movimientos

- [ ] **Tests de integración para pagos completos** (ref: integration-full-payment)
  Task ID: phase-4-integration-02
  > **Implementation**: Editar `test/integration/customer-accounts.integration.spec.ts`
  > **Details**: Tests:
  > - Pago completo marca ventas como COMPLETED
  > - Pago completo marca ingresos como isPaid = true
  > - daysOverdue resetea a 0

- [ ] **Tests de integración para recargos** (ref: integration-surcharge)
  Task ID: phase-4-integration-03
  > **Implementation**: Editar `test/integration/customer-accounts.integration.spec.ts`
  > **Details**: Tests:
  > - Aplicar recargo porcentual
  > - Aplicar recargo fijo
  > - Verificar incremento de saldo

- [ ] **Tests de integración para límite de crédito** (ref: integration-credit-limit)
  Task ID: phase-4-integration-04
  > **Implementation**: Editar `test/integration/customer-accounts.integration.spec.ts`
  > **Details**: Tests:
  > - Rechazar cargo que excede límite
  > - Aceptar pago que reduce saldo bajo límite

- [ ] **Tests de integración para suspensión/activación** (ref: integration-status)
  Task ID: phase-4-integration-05
  > **Implementation**: Editar `test/integration/customer-accounts.integration.spec.ts`
  > **Details**: Tests:
  > - Suspender cuenta
  > - Rechazar cargo en cuenta suspendida
  > - Reactivar cuenta
  > - Aceptar cargo en cuenta reactivada

- [ ] **Tests de integración para sincronización de cargos** (ref: integration-sync)
  Task ID: phase-4-integration-06
  > **Implementation**: Editar `test/integration/customer-accounts.integration.spec.ts`
  > **Details**: Tests:
  > - Crear ventas pendientes sin cargo
  > - Ejecutar syncMissingCharges
  > - Verificar que se crearon movimientos
  > - Verificar orden cronológico

---

## Phase 5: API Tests (Smoke Tests)

- [ ] **Smoke tests para endpoints de cuentas corrientes** (ref: api-smoke)
  Task ID: phase-5-api-01
  > **Implementation**: Crear `test/api/customer-accounts-api.spec.ts`
  > **Details**: Tests rápidos de humo:
  > - GET /customer-accounts retorna 401 sin auth
  > - GET /customer-accounts/stats retorna 401 sin auth
  > - GET /customer-accounts/debtors retorna 401 sin auth
  > - POST /customer-accounts/:id/charges retorna 401 sin auth
  > - POST /customer-accounts/:id/payments retorna 401 sin auth

- [ ] **Smoke tests con autenticación** (ref: api-smoke-auth)
  Task ID: phase-5-api-02
  > **Implementation**: Editar `test/api/customer-accounts-api.spec.ts`
  > **Details**: Tests con token válido:
  > - GET /customer-accounts retorna array (aunque vacío)
  > - GET /customer-accounts/stats retorna stats
  > - GET /customer-accounts/debtors retorna array
  > - POST /customer-accounts/:customerId/charges con datos válidos
  > - POST /customer-accounts/:customerId/payments con datos válidos

- [ ] **Smoke tests de validación** (ref: api-validation)
  Task ID: phase-5-api-03
  > **Implementation**: Editar `test/api/customer-accounts-api.spec.ts`
  > **Details**: Tests de validación de DTO:
  > - Crear cargo con amount < 0.01 retorna 400
  > - Crear cargo sin description retorna 400
  > - Crear pago sin paymentMethodId retorna 400
  > - Crear pago con amount < 0.01 retorna 400
  > - Aplicar recargo con surchargeType inválido retorna 400

---

## Phase 6: Helpers y Factories

- [ ] **Expandir factory de CustomerAccount** (ref: factory-expand)
  Task ID: phase-6-factory-01
  > **Implementation**: Editar `test/factories/customer-account.factory.ts`
  > **Details**: Agregar:
  > - `createApplySurchargeDTO()`
  > - `createUpdateAccountDTO()`
  > - `createAccountFiltersDTO()`
  > - Helper para crear CustomerAccount entity completo
  > - Helper para crear AccountMovement entity

- [ ] **Factory para Customer y PaymentMethod** (ref: factory-customers)
  Task ID: phase-6-factory-02
  > **Implementation**: Crear `test/factories/customer.factory.ts` si no existe
  > **Details**: Agregar helpers para crear Customer y PaymentMethod entities

---

## Phase 7: Verificación de Cobertura

- [ ] **Ejecutar tests con cobertura y verificar >= 90%** (ref: verify-coverage)
  Task ID: phase-7-verify-01
  > **Implementation**: Ejecutar `npm run test:all -- --coverage --collectCoverageFrom='src/modules/customer-accounts/**/*.ts'`
  > **Details**: Verificar:
  > - Statements >= 90%
  > - Branches >= 90%
  > - Functions >= 90%
  > - Lines >= 90%
  > - Si algún metric está < 90%, identificar líneas faltantes y agregar tests

- [ ] **Reporte final de cobertura** (ref: coverage-report)
  Task ID: phase-7-verify-02
  > **Implementation**: Guardar reporte en `coverage/customer-accounts-final.txt`
  > **Details**: Documentar mejora desde baseline

---

## Resumen de Archivos a Crear/Modificar

| Archivo | Acción | Tests Estimados |
|---------|--------|-----------------|
| `src/modules/customer-accounts/customer-accounts.service.spec.ts` | Modificar (habilitar y completar) | ~60 tests |
| `src/modules/customer-accounts/customer-accounts.controller.spec.ts` | Crear nuevo | ~30 tests |
| `test/integration/customer-accounts.integration.spec.ts` | Expandir | ~15 tests |
| `test/api/customer-accounts-api.spec.ts` | Crear nuevo | ~15 tests |
| `test/factories/customer-account.factory.ts` | Expandir | N/A |
| `test/factories/customer.factory.ts` | Crear si necesario | N/A |

**Total estimado de tests**: ~120 tests para alcanzar >= 90% de cobertura

---

## Orden Recomendado de Ejecución

1. **Phase 1**: Diagnosticar y arreglar tests existentes
2. **Phase 2**: Completar unit tests del servicio (mayor volumen)
3. **Phase 3**: Unit tests del controller
4. **Phase 6**: Factories (según se necesite)
5. **Phase 4**: Integration tests
6. **Phase 5**: API smoke tests
7. **Phase 7**: Verificación final

---

*Generated by Clavix /clavix:plan*
