# Implementation Plan

**Project**: customers-testing
**Generated**: 2025-01-20T12:00:00Z
**Goal**: Achieve ≥90% test coverage for customers module

## Technical Context & Standards
*Detected Stack & Patterns*
- **Architecture**: NestJS with TypeORM Repository pattern
- **Framework**: NestJS 10+ with Jest
- **Testing Stack**: Jest with 3 projects (unit, integration, api)
  - Unit tests: `src/**/*.spec.ts` (co-located with source)
  - Integration tests: `test/integration/**/*.spec.ts` (with real DB)
  - API tests: `test/api/**/*.spec.ts` (HTTP endpoints)
- **Module**: `apps/backend/src/modules/customers/`
- **Conventions**:
  - Mock manual con `jest.Mocked<Type>`
  - Tests en español ("debe crear...", "debe lanzar error...")
  - Setup files: `test/setup.ts`, `test/setup-integration.ts`, `test/setup-api.ts`
  - Helpers: `getTestRepository()` para tests de integración
- **DTOs**: Zod schemas + class-validator decorators
- **Entities**: Customer, CustomerCategory con TypeORM decorators

---

## Phase 1: Completar Unit Tests de CustomersService

- [x] **Completar tests para create() - validaciones de unicidad** (ref: customers.service.ts:34-89)
  Task ID: phase-1-customers-service-01
  > **Implementation**: Edit `src/modules/customers/customers.service.spec.ts`
  > **Details**:
  > - Agregar test `debe lanzar ConflictException si documento ya existe`
  > - Agregar test `debe lanzar ConflictException si email ya existe`
  > - Agregar test `debe lanzar NotFoundException si categoría no existe`
  > - Agregar test `debe limpiar campos vacíos (null/string vacío) antes de guardar`
  > - Ubicar en sección `describe('create()', () => { ... })`

- [x] **Completar tests para create() - validación fiscal CUIT/RI** (ref: customers.service.ts:174-211)
  Task ID: phase-1-customers-service-02
  > **Implementation**: Edit `src/modules/customers/customers.service.spec.ts`
  > **Details**:
  > - Agregar test `debe crear cliente RI sin CUIT cuando emisor no es RI`
  > - Agregar test `debe lanzar BadRequestException si cliente es RI sin CUIT (11 dígitos)`
  > - Agregar test `debe lanzar BadRequestException si cliente es RI con CUIT inválido (< 11 dígitos)`
  > - Agregar test `debe permitir cliente no RI sin CUIT`
  > - Mock `fiscalConfigService.getPublicConfiguration` retornando `{ ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO }`

- [x] **Completar tests para update()** (ref: customers.service.ts:125-132)
  Task ID: phase-1-customers-service-03
  > **Implementation**: Edit `src/modules/customers/customers.service.spec.ts`
  > **Details**:
  > - Crear sección `describe('update()', () => { ... })`
  > - Agregar test `debe actualizar cliente exitosamente`
  > - Agregar test `debe lanzar ConflictException si documento duplicado en update`
  > - Agregar test `debe lanzar ConflictException si email duplicado en update`
  > - Agregar test `debe lanzar NotFoundException si categoría no existe en update`
  > - Agregar test `debe validar CUIT si cambia condición IVA a RI en update`
  > - Agregar test `debe actualizar solo campos proporcionados`

- [x] **Completar tests para métodos restantes** (ref: customers.service.ts:251-260)
  Task ID: phase-1-customers-service-04
  > **Implementation**: Edit `src/modules/customers/customers.service.spec.ts`
  > **Details**:
  > - Agregar test para `getActiveCustomers()` - `debe retornar clientes activos`
  > - Agregar test para `getStats()` - `debe retornar estadísticas completas`
  > - Verificar que `getStats()` retorne estructura: `{ total, active, inactive, byCategory }`

---

## Phase 2: Crear Unit Tests de CustomerCategoriesService

- [x] **Crear archivo de specs para CustomerCategoriesService** (ref: customer-categories.service.ts)
  Task ID: phase-2-categories-service-01
  > **Implementation**: Create `src/modules/customers/customer-categories.service.spec.ts`
  > **Details**:
  > - Estructura base igual a `customers.service.spec.ts`
  > - Mock de `CustomerCategoriesRepository`
  > - Importar `generateColorFromName` (real, no mock)
  > - Secciones: `create()`, `findAll()`, `findActive()`, `findOne()`, `update()`, `remove()`

- [x] **Tests para create() de categorías** (ref: customer-categories.service.ts:23-38)
  Task ID: phase-2-categories-service-02
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `debe crear categoría con datos válidos`
  > - `debe lanzar ConflictException si nombre ya existe`
  > - `debe generar color automático si no se proporciona`
  > - `debe usar color proporcionado si existe`

- [x] **Tests para findAll() y findActive()** (ref: customer-categories.service.ts:43-54)
  Task ID: phase-2-categories-service-03
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `debe listar todas las categorías ordenadas por nombre`
  > - `debe listar solo categorías activas`

- [x] **Tests para findOne() y update()** (ref: customer-categories.service.ts:59-87)
  Task ID: phase-2-categories-service-04
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `debe obtener categoría por ID`
  > - `debe lanzar NotFoundException si categoría no existe`
  > - `debe actualizar categoría exitosamente`
  > - `debe lanzar ConflictException si nombre duplicado en update`

- [x] **Tests para remove()** (ref: customer-categories.service.ts:93-106)
  Task ID: phase-2-categories-service-05
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `debe eliminar categoría sin clientes asociados`
  > - `debe lanzar ConflictException si categoría tiene clientes`
  > - `debe incluir cantidad de clientes en mensaje de error`

---

## Phase 3: Crear Unit Tests de Repositories

- [x] **Crear specs para CustomersRepository** (ref: customers.repository.ts)
  Task ID: phase-3-repositories-01
  > **Implementation**: Create `src/modules/customers/customers.repository.spec.ts`
  > **Details**:
  > - Extender de Repository requiere mock de DataSource
  > - Mockear `createQueryBuilder` con interface fluida (chainable)
  > - Métodos a testear: `findWithFilters()`, `findByDocumentNumber()`, `findByEmail()`, `findActiveCustomers()`, `getCustomerStats()`
  > - Usar jest.fn() para chain: `qb.leftJoinAndSelect.mockReturnThis()`

- [x] **Tests de filtros en findWithFilters()** (ref: customers.repository.ts:19-72)
  Task ID: phase-3-repositories-02
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `debe aplicar filtro de búsqueda por texto`
  > - `debe aplicar filtro por categoría`
  > - `debe aplicar filtro por estado activo/inactivo`
  > - `debe aplicar filtro por ciudad`
  > - `debe aplicar filtro por provincia`
  > - `debe aplicar ordenamiento y paginación`
  > - `debe combinar múltiples filtros`

- [x] **Tests de métodos simples de CustomersRepository** (ref: customers.repository.ts:77-128)
  Task ID: phase-3-repositories-03
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `findByDocumentNumber()` - debe buscar por documento
  > - `findByEmail()` - debe buscar por email
  > - `findActiveCustomers()` - debe retornar activos con relaciones
  > - `getCustomerStats()` - debe calcular estadísticas correctamente

- [x] **Crear specs para CustomerCategoriesRepository** (ref: customer-categories.repository.ts)
  Task ID: phase-3-repositories-04
  > **Implementation**: Create `src/modules/customers/customer-categories.repository.spec.ts`
  > **Details**:
  > - Mock DataSource igual que CustomersRepository
  > - Métodos: `findActiveCategories()`, `findByName()`, `findByIds()`, `countCustomersByCategory()`
  > - Probar query builder para `countCustomersByCategory()`

---

## Phase 4: Crear Integration Tests

- [x] **Crear archivo de integración para Customers** (ref: test/integration/)
  Task ID: phase-4-integration-01
  > **Implementation**: Create `test/integration/customers.integration.spec.ts`
  > **Details**:
  > - Importar `testDataSource` y setup desde `../setup-integration`
  > - Usar `getTestRepository(Customer)` y `getTestRepository(CustomerCategory)`
  > - Crear helper `seedCustomer()` y `seedCategory()` para reutilizar
  > - Cada test es independiente gracias a beforeEach que hace TRUNCATE

- [x] **Tests de integración CRUD Customers** (ref: integración con BD real)
  Task ID: phase-4-integration-02
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `debe crear y persistir cliente con todos los campos`
  > - `debe buscar cliente por documento number`
  > - `debe buscar cliente por email`
  > - `debe hacer soft delete (isActive = false)`
  > - `debe listar clientes activos`
  > - `debe calcular estadísticas correctamente`

- [x] **Tests de integración relaciones** (ref: relación Customer ↔ CustomerCategory)
  Task ID: phase-4-integration-03
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `debe crear cliente con categoría asociada`
  > - `debe cargar categoría en lazy loading`
  > - `debe contar clientes por categoría`

- [x] **Crear archivo de integración para CustomerCategories** (ref: test/integration/)
  Task ID: phase-4-integration-04
  > **Implementation**: Create `test/integration/customer-categories.integration.spec.ts`
  > **Details**:
  > - Estructura similar a customers.integration.spec.ts
  > - Tests: crear, buscar por nombre, contar clientes, eliminar

---

## Phase 5: Crear API Tests (HTTP Endpoints)

- [ ] **Crear specs API para CustomersController** (ref: customers.controller.ts)
  Task ID: phase-5-api-01
  > **Implementation**: Create `test/api/customers.api.spec.ts`
  > **Details**:
  > - Setup completo con AppModule (ver `smoke-api.spec.ts`)
  > - Usar `supertest` para HTTP requests
  > - Helper `getAuthToken()` desde `setup-api.ts` (o crear login inline)
  > - Configurar ValidationPipe igual que producción

- [ ] **Tests API POST /customers** (ref: customers.controller.ts:39-46)
  Task ID: phase-5-api-02
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `POST /customers con datos válidos debe retornar 201`
  > - `POST /customers sin auth debe retornar 401`
  > - `POST /customers con documento duplicado debe retornar 409`
  > - `POST /customers con datos inválidos debe retornar 400`

- [ ] **Tests API GET /customers** (ref: customers.controller.ts:48-74)
  Task ID: phase-5-api-03
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `GET /customers debe retornar lista paginada`
  > - `GET /customers con filtro search debe filtrar correctamente`
  > - `GET /customers con parámetros de ordenamiento`
  > - `GET /customers/active debe retornar activos`
  > - `GET /customers/stats debe retornar estadísticas`

- [x] **Tests API GET /customers/:id, PATCH, DELETE** (ref: customers.controller.ts:90-116)
  Task ID: phase-5-api-04
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `GET /customers/:id existente debe retornar cliente`
  > - `GET /customers/:id inexistente debe retornar 404`
  > - `GET /customers/:id con UUID inválido debe retornar 400`
  > - `PATCH /customers/:id debe actualizar`
  > - `DELETE /customers/:id debe desactivar (soft delete)`

- [x] **Tests API para CustomerCategoriesController** (ref: customer-categories.controller.ts)
  Task ID: phase-5-api-05
  > **Implementation**: Create `test/api/customer-categories.api.spec.ts`
  > **Details**:
  > - `POST /customer-categories` - 201, 400, 409
  > - `GET /customer-categories` - lista completa
  > - `GET /customer-categories/active` - solo activas
  > - `GET /customer-categories/:id` - por ID
  > - `PATCH /customer-categories/:id` - actualizar
  > - `DELETE /customer-categories/:id` - eliminar (validar clientes asociados)

---

## Phase 6: Crear Smoke Tests

- [x] **Crear smoke test para módulo customers** (ref: smoke-api.spec.ts)
  Task ID: phase-6-smoke-01
  > **Implementation**: Create `test/api/smoke-customers.spec.ts`
  > **Details**:
  > - Tests rápidos que verifican disponibilidad del módulo
  > - `GET /customers debe responder (aunque vacío)`
  > - `GET /customer-categories debe responder (aunque vacío)`
  > - `GET /customers/stats debe retornar estructura válida`
  > - Sin login - usar pública o crear usuario de test

- [x] **Verificar performance de endpoints críticos** (ref: smoke-api.spec.ts:128-146)
  Task ID: phase-6-smoke-02
  > **Implementation**: En archivo creado arriba
  > **Details**:
  > - `GET /customers debe responder en < 200ms`
  > - `GET /customers/active debe responder en < 150ms`
  > - `GET /customer-categories debe responder en < 100ms`
  > - Usar `Date.now()` para medir duración

---

## Phase 7: Verificar Cobertura y Ajustes

- [ ] **Ejecutar tests con coverage y analizar resultados** (ref: jest.config.ts:37-44)
  Task ID: phase-7-coverage-01
  > **Implementation**: Run `npm run test:cov -- customers`
  > **Details**:
  > - Revisar reporte en `coverage/index.html`
  > - Identificar líneas no cubiertas en rojo
  > - Crear tasks específicas para cubrir lagunas

- [ ] **Completar cobertura de ramas (branches) faltantes** (ref: análisis coverage)
  Task ID: phase-7-coverage-02
  > **Implementation**: Edit spec files según gaps identificados
  > **Details**:
  > - Verificar condiciones ternarias y cortocircuitos
  > - Revisar `validateCuitForResponsableInscripto` - tiene multiple early returns
  > - Revisar `buildCustomerUpdatePayload` - tiene múltiples if por campo
  > - Asegurar que ambos caminos de cada if sean ejecutados

- [ ] **Cubrir edge cases y error paths** (ref: análisis coverage)
  Task ID: phase-7-coverage-03
  > **Implementation**: Edit spec files según gaps
  > **Details**:
  > - Validar con strings vacías, null, undefined
  > - Probar con UUIDs inválidos
  > - Probar con caracteres especiales en nombres
  > - Probar con emails inválidos (formato)
  > - Probar simultaneidad (mismo documento creado por dos usuarios)

- [ ] **Verificar umbral ≥90% y ajustar jest.config.ts si es necesario** (ref: jest.config.ts:37-44)
  Task ID: phase-7-coverage-04
  > **Implementation**: Edit `jest.config.ts` o validar umbral
  > **Details**:
  > - Ejecutar `npm run test:cov` final
  > - Verificar que customers module tenga ≥90% en statements, branches, functions, lines
  > - Documentar resultado final

---

## Summary of Files to Create

| File | Type | Lines Est |
|------|------|-----------|
| `src/modules/customers/customers.service.spec.ts` | Edit (extender) | +200 |
| `src/modules/customers/customer-categories.service.spec.ts` | Create | ~180 |
| `src/modules/customers/customers.repository.spec.ts` | Create | ~200 |
| `src/modules/customers/customer-categories.repository.spec.ts` | Create | ~100 |
| `test/integration/customers.integration.spec.ts` | Create | ~150 |
| `test/integration/customer-categories.integration.spec.ts` | Create | ~80 |
| `test/api/customers.api.spec.ts` | Create | ~250 |
| `test/api/customer-categories.api.spec.ts` | Create | ~150 |
| `test/api/smoke-customers.spec.ts` | Create | ~80 |

**Total estimado**: ~1,390 líneas de tests

---

*Generated by Clavix /clavix:plan*
