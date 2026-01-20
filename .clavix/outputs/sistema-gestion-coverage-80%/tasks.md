# Implementation Plan

**Project**: sistema-gestion
**Generated**: 2025-01-19T21:30:22Z

## Technical Context & Standards

**Detected Stack & Patterns:**

**Backend (NestJS):**
- **Architecture**: Modular monolith with NestJS, TypeORM (PostgreSQL), feature-based organization
- **Framework**: NestJS 10.0.0, TypeScript 5.0.0
- **Styling**: N/A (API only)
- **State**: N/A (stateless REST API)
- **API**: REST API with Swagger documentation, TypeORM ORM
- **Conventions**:
  - Files: kebab-case (`auth.service.ts`, `user.controller.ts`)
  - Classes/Interfaces: PascalCase (`AuthService`, `CreateUserDto`)
  - Imports: NestJS/common → Third-party → Module imports (per AGENTS.md)
  - Testing: Jest with `supertest`, test files co-located with source (`*.spec.ts`)
  - Path aliases: `@/` resolves to `./src`
  - Separation: Three test projects - unit (src/**/*.spec.ts), integration, api (test/**/*.spec.ts)

**Frontend (React + Vite):**
- **Architecture**: Feature-sliced design, SPA with React Router
- **Framework**: React 18.2.0, Vite 5.0.0, TypeScript 5.0.0
- **Styling**: Tailwind CSS 3.4.0 + shadcn/ui (Radix UI primitives)
- **State**: Zustand 4.4.7 (stores in `/src/stores`)
- **API**: Axios 1.6.2 + TanStack Query 5.90.11 for data fetching
- **Conventions**:
  - Files: kebab-case components (`sale-form.tsx`, `dashboard-page.tsx`)
  - Components: PascalCase (`SaleForm`, `DashboardPage`)
  - Imports: React/core → Third-party → `@/` aliases (per AGENTS.md)
  - Testing: Vitest with `@testing-library/react`, jsdom environment
  - Path aliases: `@/` resolves to `./src`
  - Forms: React Hook Form + Zod validation

**Testing Infrastructure:**
- **Backend**: Jest 29.0.0 with ts-jest 29.0.0, coverage threshold 70%
- **Frontend**: Vitest 1.0.0, Playwright for e2e
- **SonarQube**: Already configured for both apps (localhost:9000)

**Current Coverage Status:**
- Backend: 12 test files exist, 10 modules MISSING tests
- Frontend: 4 test files exist
- Backend coverage report already exists (apps/backend/coverage/lcov.info)
- Frontend coverage not configured yet

---

- [x] **Configurar SonarQube para usar modo offline** (ref: Configuración necesaria)
  Task ID: phase-1-analysis-01a
  > **Implementation**: Crear archivo `.sonar/sonar-project.properties` en raíz del proyecto.
  > **Details**:
  > Agregar configuración para modo offline (sin servidor SonarQube):
  > ```properties
  > # SonarQube configuration (Offline Mode)
  > sonar.projectKey=sistema-gestion-backend
  > sonar.projectName=Sistema Gestión Backend
  > sonar.host.url=http://localhost:9000
  > sonar.working.directory=.scannerwork
  > sonar.analysis.mode=preview
  > sonar.import.sources=src
  > sonar.import.tests=src
  > sonar.sourceEncoding=UTF-8
  > sonar.java.binaries=.
  > sonar.java.sourceSuffixes=.ts
  > ```
  > Copiar a `apps/frontend/.sonar/sonar-project.properties` y crear archivo en raíz.

- [x] **Documentar problema de SonarQube y solución** (ref: Diagnóstico del bloqueo)
  Task ID: phase-1-analysis-01
  > **Implementation**: Crear documento `docs/testing/sonar-blocker.md` documentando el problema y solución.
  > **Details**: Documentar:
  > - Problema: SonarQube server no disponible en localhost:9000 (error 401 al intentar conectar)
  > - Solución: Configurar SonarQube para modo offline, permitir ejecutar análisis de cobertura sin servidor externo
  > - Justificación: Esto permite ejecutar análisis de cobertura sin servidor, usando modo preview local
  > - Enfoque elegido: Modo Offline
  > - Beneficios: Ejecuciones más rápidas, análisis completo disponible localmente

- [x] **Verificar configuración de SonarQube**
  Task ID: phase-1-analysis-01b
  > **Implementation**: Verificar que SonarQube se puede ejecutar en modo offline.
  > **Details**:
  > - Revisar `sonar-scanner.properties` en raíz
  > - Si existe `sonar.working.directory=.scannerwork`, el modo offline está configurado
  > - Ejecutar `sonar-scanner --help` para ver comandos disponibles
  > - Documentar opción elegida en archivo `.clavix/outputs/sistema-gestion-coverage-80%/sonar-approach.md`
  > - Comando para ejecutar: `sonar-scanner -Dsonar.projectKey=sistema-gestion-backend -Dsonar.working.directory=.scannerwork -preview`

- [x] **Configurar reportes de cobertura para frontend** (ref: Infraestructura necesaria)
  Task ID: phase-2-config-01
  > **Implementation**: Modificar `apps/frontend/package.json` scripts para incluir comandos de cobertura.
  > **Details**: Scripts ya están configurados en package.json: `test` y `test:coverage`. No se requiere modificación adicional.

- [x] **Crear estructura de test en frontend** (ref: Infraestructura necesaria)
  Task ID: phase-2-config-02
  > **Implementation**: Crear directorios de organización de tests en `apps/frontend/src/test/` si no existen.
  > **Details**:
  > Crear:
  > - `apps/frontend/src/test/setup.ts` (ya existe, verificar configuración jsdom)
  > - `apps/frontend/src/test/factories/` (para test data factory)
  > - `apps/frontend/src/test/mocks/` (para API mocks)
  > **Resultado**: Directorios creados exitosamente

- [x] **Verificar configuración de Vitest** (ref: Infraestructura necesaria)
  Task ID: phase-2-config-03
  > **Implementation**: Revisar y actualizar `apps/frontend/vitest.config.ts`.
  > **Details**: Vitest.config.ts ya está correctamente configurado con:
  > - `environment: 'jsdom'`
  > - `globals: true`
  > - `setupFiles: ['./src/test/setup.ts']`
  > - `coverage.provider: 'v8'` con reportes correctos
  > - Exclusiones correctas: `node_modules`, `e2e`, `src/test`, `**/*.e2e.{ts,tsx}'`

---

## Phase 3: Tests Prioritarios de Backend - Alto Impacto

- [x] **Configurar SonarQube para usar modo offline** (ref: Configuración necesaria)
  Task ID: phase-1-analysis-01a
  > **Implementation**: Crear archivo `.sonar/sonar-project.properties` en raíz del proyecto.
  > **Details**:
  > Agregar configuración para modo offline (sin servidor SonarQube):
  > ```properties
  > # SonarQube configuration (Offline Mode)
  > sonar.projectKey=sistema-gestion-backend
  > sonar.projectName=Sistema Gestión Backend
  > sonar.host.url=http://localhost:9000
  > sonar.working.directory=.scannerwork
  > sonar.analysis.mode=preview
  > sonar.import.sources=src
  > sonar.import.tests=src
  > sonar.sourceEncoding=UTF-8
  > sonar.java.binaries=.
  > sonar.java.sourceSuffixes=.ts
  > ```
  > Copiar a `apps/frontend/.sonar/sonar-project.properties` y crear archivo en raíz.

- [x] **Documentar problema de SonarQube y solución** (ref: Diagnóstico del bloqueo)
  Task ID: phase-1-analysis-01
  > **Implementation**: Crear documento `docs/testing/sonar-blocker.md` documentando el problema y solución.
  > **Details**: Documentar:
  > - Problema: SonarQube server no disponible en localhost:9000 (error 401 al intentar conectar)
  > - Solución: Configurar SonarQube para modo offline, permitir ejecutar análisis de cobertura sin servidor externo
  > - Justificación: Esto permite ejecutar análisis de cobertura sin servidor, usando modo preview local
  > - Enfoque elegido: Modo Offline
  > - Beneficios: Ejecuciones más rápidas, análisis completo disponible localmente
  > - Limitaciones:
  > - No funcionalidad de quality gate automático en SonarQube
  > - Solo análisis local, sin pull request de código

- [x] **Configurar SonarQube para usar modo offline** (ref: Configuración necesaria)
  Task ID: phase-1-analysis-01a
  > **Implementation**: Crear archivo `.sonar/sonar-project.properties` en raíz del proyecto.
  > **Details**:
  > Agregar configuración para modo offline (sin servidor SonarQube):
  > ```properties
  > # SonarQube configuration (Offline Mode)
  > sonar.projectKey=sistema-gestion-backend
  > sonar.projectName=Sistema Gestión Backend
  > sonar.host.url=http://localhost:9000
  > sonar.working.directory=.scannerwork
  > sonar.analysis.mode=preview
  > sonar.import.sources=src
  > sonar.import.tests=src
  > sonar.sourceEncoding=UTF-8
  > sonar.java.binaries=.
  > sonar.java.sourceSuffixes=.ts
  > ```
  > Copiar a `apps/frontend/.sonar/sonar-project.properties` y crear archivo en raíz.

- [x] **Verificar configuración de SonarQube**
  Task ID: phase-1-analysis-01b
  > **Implementation**: Verificar que SonarQube se puede ejecutar en modo offline.
  > **Details**:
  > - Revisar `sonar-scanner.properties` en raíz
  > - Si existe `sonar.working.directory=.scannerwork`, el modo offline está configurado
  > - Ejecutar `sonar-scanner --help` para ver comandos disponibles
  > - Documentar opción elegida en archivo `.clavix/outputs/sistema-gestion-coverage-80%/sonar-approach.md`
  > - Comando para ejecutar: `sonar-scanner -Dsonar.projectKey=sistema-gestion-backend -Dsonar.working.directory=.scannerwork -preview`

- [x] **Identificar archivos con menor cobertura en backend** (ref: Metodología obligatoria paso 2)
  Task ID: phase-1-analysis-03
  > **Implementation**: Analizar reporte de SonarQube (en modo offline usando `sonar-scanner -Dsonar.projectKey=sistema-gestion-backend -Dsonar.working.directory=.scannerwork -preview`).
  > **Details**: Analizar reporte HTML generado en `coverage/lcov-report/` para identificar:
  > 1. Archivos .ts con menor % de cobertura
  > 2. Líneas de código sin cubrir con mayor impacto
  > 3. Funciones/métodos críticos sin testear
  > **Command**: `sonar-scanner -Dsonar.projectKey=sistema-gestion-backend -Dsonar.working.directory=.scannerwork -preview`

- [ ] **Generar reporte de brechas de cobertura (Gap Analysis)** (ref: Metodología obligatoria paso 3)
  Task ID: phase-1-analysis-04
  > **Implementation**: Crear documento `docs/testing/coverage-gap-analysis.md` tras ejecutar análisis.
  > **Details**: Documentar:
  > - Módulos backend que NO tienen tests: audit, backup, customers, reports, sales, suppliers (10 módulos)
  > - Módulos backend CON tests: auth, cash-register, configuration, customer-accounts, expenses, incomes, inventory, products, purchases (8 módulos)
  > - Componentes frontend sin tests: Sales, Products, Customers, Expenses, Incomes, Dashboard components
  > - Archivos sugeridos para priorizar (mayor número de líneas sin cubrir y alta complejidad)
  > - Priorización sugerida: Auth, Sales, Products (alto impacto en negocio)

- [x] **Configurar reportes de cobertura para frontend** (ref: Infraestructura necesaria)
  Task ID: phase-2-config-01
  > **Implementation**: Modificar `apps/frontend/package.json` scripts para incluir comandos de cobertura.
  > **Details**: Scripts ya están configurados en package.json: `test` y `test:coverage`. No se requiere modificación adicional.

- [x] **Crear estructura de test en frontend** (ref: Infraestructura necesaria)
  Task ID: phase-2-config-02
  > **Implementation**: Crear directorios de organización de tests en `apps/frontend/src/test/` si no existen.
  > **Details**:
  > Crear:
  > - `apps/frontend/src/test/setup.ts` (ya existe, verificar configuración jsdom)
  > - `apps/frontend/src/test/factories/` (para test data factory)
  > - `apps/frontend/src/test/mocks/` (para API mocks)
  > **Resultado**: Directorios creados exitosamente

- [x] **Verificar configuración de Vitest** (ref: Infraestructura necesaria)
  Task ID: phase-2-config-03
  > **Implementation**: Revisar y actualizar `apps/frontend/vitest.config.ts`.
  > **Details**: Vitest.config.ts ya está correctamente configurado con:
  > - `environment: 'jsdom'`
  > - `globals: true`
  > - `setupFiles: ['./src/test/setup.ts']`
  > - `coverage.provider: 'v8'` con reportes correctos
  > - Exclusiones correctas: `node_modules`, `e2e`, `src/test`, `**/*.e2e.{ts,tsx}'`

## Bloqueo Detectado

El archivo `apps/backend/src/modules/auth/auth.controller.spec.ts` tiene errores de compilación TypeScript:
- El import de AuthModule es incorrecto: está en `./decorators/auth.module`
- Faltan tipos de respuesta (LoginResponseDto, etc.)
- Los expects no coinciden con la estructura real de respuesta del controlador

**Opciones para continuar:**

1. **Ejecutar tests existentes de auth.service.spec.ts** - Auth.service ya tiene tests que cubren la lógica de negocio. Esto sería el enfoque más rápido para aumentar cobertura en AuthService.
2. **Crear test simple para AuthController** - Escribir tests unitarios básicos sin tipos complejos, enfocándose en el comportamiento sin verificar estructura de respuesta detallada.
3. **Continuar con otros módulos prioritarios** - Saltar AuthController por ahora y crear tests para SalesService y ProductsService que también tienen alto impacto.

**¿Cuál prefiere?** (recomendado: Opción 1 - ejecutar tests de auth.service.spec.ts que ya cubren el servicio)

- [x] **Verificar y ejecutar tests de SalesService** (ref: Metodología iterativa - módulo sin tests)
  Task ID: phase-3-backend-02
  > **Implementation**: Verificar `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Ya existe con tests completos:
  > - Validación de caja abierta ✅
  > - Ventas a cuenta corriente ✅
  > - Validación de stock ✅
  > - Generación de comprobante ✅
  > - Efectos en caja (registros de ingresos) ✅
  > - Validación de pagos ✅
  > - Cálculos de totales ✅
  > - Auditoría ✅
  > **Resultado**: 17 tests pasando exitosamente
  > **Impacto**: Core business logic, ventas son la función principal

- [x] **Verificar y crear tests para CustomersService** (ref: Metodología iterativa - módulo sin tests)
  Task ID: phase-3-backend-04
  > **Implementation**: Crear `apps/backend/src/modules/customers/customers.service.spec.ts`.
  > **Details**:
  > - Testear: CRUD completo de clientes
  > - Mockear: `CustomersRepository`, `CustomerCategoriesService`
  > - Verificar: búsqueda por nombre/documento, validación de duplicados, soft delete
  > - Testar: `getStats()` con métricas correctas
  > **Impacto**: Módulo completo sin cobertura, afecta ventas y cuentas corrientes
  > **Resultado**: Tests creados con 26 casos de prueba cubriendo:
  >   - create() con validaciones de documento, email, categoría, CUIT RI
  >   - findAll() con paginación y filtros
  >   - findOne() por ID
  >   - update() con validaciones de email, categoría
  >   - remove() (soft delete)
  >   - getActiveCustomers() para selectores
  >   - getStats() para estadísticas

- [ ] **Verificar y crear tests para AuditService** (ref: Módulo sin tests, seguridad importante)
  Task ID: phase-3-backend-03
  > **Implementation**: Aumentar cobertura en `apps/backend/src/modules/products/products.service.spec.ts`.
  > **Details**:
  > - Testear: cálculo de precio con margen (`calculatePrice()`, `getEffectiveProfitMargin()`)
  > - Testear: validación de stock mínimo, lógica de marcas/brand
  > - Mockear: `ProductsRepository`, `ProductCategoriesService`, `InventoryService`
  > - Verificar: create con stock inicial, update con recálculo de precios, soft deletes
  > **Impacto**: Products es módulo central usado por ventas, inventory, purchases

---

## Phase 4: Tests Prioritarios de Backend - Módulos Sin Cobertura

- [ ] **Crear tests para SuppliersService** (ref: Módulo sin tests)
  Task ID: phase-4-backend-01
  > **Implementation**: Crear `apps/backend/src/modules/suppliers/suppliers.service.spec.ts`.
  > **Details**:
  > - Testear: CRUD completo (create, findAll, findOne, update, remove, findActive, searchByName)
  > - Mockear: `SuppliersRepository` usando factory pattern
  > - Verificar: validación de documento único (CUIT/CUIT), soft delete, filtros de búsqueda
  > - Testar: `getStats()` con conteo correcto de proveedores
  > **Impacto**: Módulo completo sin cobertura actualmente, impacta purchases y ventas

- [ ] **Crear tests para CustomerAccountsService** (ref: Módulo sin tests)
  Task ID: phase-4-backend-02
  > **Implementation**: Crear `apps/backend/src/modules/customer-accounts/customer-accounts.service.spec.ts`.
  > **Details**:
  > - Testear: registro de cargos (`createTransaction()`), saldo de cuenta (`getBalance()`)
  > - Mockear: `CustomerAccountsRepository`, `SalesService`
  > - Verificar: tipos de transacción (cargo/abono), límites de crédito, historial
  > - Testar: `getAccountActivity()` con paginación
  > **Impacto**: Cuenta corriente es feature de negocio importante

- [ ] **Crear tests para CustomersService** (ref: Módulo sin tests)
  Task ID: phase-4-backend-03
  > **Implementation**: Crear `apps/backend/src/modules/customers/customers.service.spec.ts`.
  > **Details**:
  > - Testear: CRUD completo de clientes
  > - Mockear: `CustomersRepository`, `CustomerAccountsService`
  > - Verificar: búsqueda por nombre/documento, validación de duplicados, soft delete
  > - Testar: `getStats()` con métricas correctas
  > **Impacto**: Módulo completo sin cobertura, afecta ventas y cuentas corrientes

- [ ] **Crear tests para ExpensesService** (ref: Módulo sin tests)
  Task ID: phase-4-backend-04
  > **Implementation**: Crear `apps/backend/src/modules/expenses/expenses.service.spec.ts` (ya existe, verificar cobertura).
  > **Details**: Si tiene baja cobertura, añadir tests para:
  > - Mockear: `ExpensesRepository`, `CashRegisterService`
  > - Verificar: validación de caja abierta para pagos, categorías, marca como pagado
  > - Testar: `markAsPaid()` con registro en caja
  > **Impacto**: Gastos y cash register están interconectados

- [ ] **Crear tests para IncomesService** (ref: Módulo sin tests)
  Task ID: phase-4-backend-05
  > **Implementation**: Crear `apps/backend/src/modules/incomes/incomes.service.spec.ts` (ya existe, verificar cobertura).
  > **Details**: Si tiene baja cobertura, añadir tests para:
  > - Mockear: `IncomesRepository`, `CashRegisterService`, `CustomerAccountsService`
  > - Verificar: ingresos a cuenta corriente, categorías, marca como pagado
  > - Testar: `markAsPaid()` con registro en caja y cuenta
  > **Impacto**: Incomes están interconectados con cash register y cuentas corrientes

---

## Phase 5: Tests de Frontend - Alto Impacto

- [ ] **Arreglar tests de SaleForm.spec.tsx** (ref: Tests existentes fallan)
  Task ID: phase-5-frontend-01
  > **Implementation**: Modificar `apps/frontend/src/features/sales/components/SaleForm.spec.tsx`.
  > **Details**:
  > - Resolver errores de contexto de Dialog: envolver componentes que usan Radix UI Dialog en provider
  > - Agregar mocks faltantes: `useDiscountCalculation` en `useSaleFormEffects`
  > - Mockear `@/features/sales/hooks/useSaleFormEffects` correctamente
  > - Verificar que tests renderizan sin errores de React context
  > **Impacto**: Tests de ventas críticos para frontend

- [ ] **Crear tests para SalesModule API hooks** (ref: Hooks sin tests)
  Task ID: phase-5-frontend-02
  > **Implementation**: Crear `apps/frontend/src/features/sales/hooks/useSales.spec.ts` (o similar).
  > **Details**:
  > - Mockear `TanStack Query` usando `vi.mock('@tanstack/react-query')`
  > - Testear: `useSales()` hook con fetching de ventas
  > - Testear: filtros de fecha, paginación, estados de carga, error handling
  > - Usar `renderHook` de `@testing-library/react`
  > **Impacto**: Hook principal de ventas usado en múltiples componentes

- [ ] **Crear tests para ProductsModule components** (ref: Componentes sin tests)
  Task ID: phase-5-frontend-03
  > **Implementation**: Crear tests para componentes de productos.
  > **Details**:
  > - Crear `apps/frontend/src/features/products/ProductList.spec.tsx`
  > - Crear `apps/frontend/src/features/products/ProductForm.spec.tsx`
  > - Mockear: `@tanstack/react-query`, API calls
  > - Testear: renderizado, búsqueda, edición, eliminación, filtrado
  > - Usar mocks de `src/test/mocks/products.mock.ts`
  > **Impacto**: Products es módulo central en POS

---

## Phase 6: Ejecución de SonarQube y Validación

- [ ] **Ejecutar SonarQube scan de backend tras tests prioritarios** (ref: Metodología obligatoria paso 5)
  Task ID: phase-6-scan-01
  > **Implementation**: Ejecutar `cd apps/backend && npm run sonar:scan`.
  > **Details**:
  > - SonarQube analizará código nuevo + tests
  > - Verificar que coverage % aumenta significativamente
  > - Revisar reporte en http://localhost:9000/dashboard?id=sistema-gestion-backend

- [ ] **Ejecutar SonarQube scan de frontend tras tests prioritarios** (ref: Metodología obligatoria paso 5)
  Task ID: phase-6-scan-02
  > **Implementation**: Ejecutar `cd apps/frontend && npm run sonar:scan`.
  > **Details**:
  > - SonarQube analizará código nuevo + tests
  > - Verificar que coverage % se reporta correctamente
  > - Revisar reporte en http://localhost:9000/dashboard?id=sistema-gestion-frontend

- [ ] **Validar progreso y documentar mejoras** (ref: Metodología obligatoria paso 6)
  Task ID: phase-6-validation-01
  > **Implementation**: Actualizar `docs/testing/coverage-gap-analysis.md` con resultados post-test.
  > **Details**:
  > - Comparar coverage % antes vs después de cada iteración
  > - Documentar qué tests agregaron qué % de mejora
  > - Calcular delta hacia objetivo del 80%
  > - Si aún < 80%, identificar próximos módulos para priorizar

---

## Phase 7: Iteración Adicional para Alcanzar 80% (Si Necesario)

- [ ] **Tests adicionales de Services sin cobertura completa** (ref: Metodología iterativa)
  Task ID: phase-7-backend-01
  > **Implementation**: Basado en resultados de SonarQube post-Phase 6, crear tests para módulos con menor cobertura.
  > **Details**:
  > - Posibles objetivos: `AuditService`, `ReportsService`, `BackupService`
  > - O expandir tests existentes con casos edge y error handling
  > - Seguir patrones establecidos: mocks con factories, cleanup en afterEach

- [ ] **Tests adicionales de Frontend** (ref: Metodología iterativa)
  Task ID: phase-7-frontend-01
  > **Implementation**: Basado en resultados de SonarQube post-Phase 6, crear tests para componentes con menor cobertura.
  > **Details**:
  > - Posibles objetivos: `Dashboard` features, `Customers` features, `Expenses`/`Incomes` forms
  - Focar en casos de integración de hooks, manejo de estado, error boundaries
  - Asegurar que todos los tests nuevos pasan

- [ ] **Validación final de 80% target** (ref: Metodología obligatoria paso 7)
  Task ID: phase-7-validation-01
  > **Implementation**: Ejecutar `npm run sonar:scan` en ambos backend y frontend.
  > **Details**:
  > - Verificar que ambos proyectos reportan ≥ 80% coverage
  > - Si frontend aún no tiene tests, diagnosticar problema de configuración de vitest
  > - Documentar justificación si existen archivos imposibles de testear

- [ ] **Documentación final de alcanzamiento de objetivo** (ref: Metodología obligatoria paso 7)
  Task ID: phase-7-docs-01
  > **Implementation**: Crear `docs/testing/coverage-80%-achieved.md`.
  > **Details**:
  > - Captura de pantalla de SonarQube dashboard mostrando ≥ 80%
  > - Resumen de tests creados por módulo
  > - Justificación de archivos no testeables (si los hay)
  > - Recomendaciones para mantener cobertura a futuro

---

## Notas Importantes

**Archivos imposibles o no razonables de testear:**
- Archivos de configuración: `*.config.ts`, `tsconfig.json`, `jest.config.ts`, `vite.config.ts`
- Archivos de tipo: `*.entity.ts`, `*.dto.ts` (solo definiciones de datos)
- Archivos de migración: `src/migrations/**/*.ts` (TypeORM migrations)
- Scripts utilitarios: `src/scripts/**/*.ts` (seed scripts, utilities)
- Entry points: `main.ts`, `main.tsx`
- Storybook/Stories: `src/**/*.stories.tsx` (excluidos por SonarQube ya)

**Estrategia de Mocking:**
- Backend: Usar `TestingModule` de NestJS con `overrideProviders` para mocks
- Frontend: Usar `vi.mock()` de Vitest con implementaciones simples
- Evitar mocks complejos: Mantenerlos simples para que los tests sean determinísticos

**Buenas prácticas de testing:**
- Isolamiento: Cada test debe ser independiente, no depender de orden de ejecución
- AAA Pattern: Arrange-Act-Assert para claridad
- Descriptivos: Nombres de tests que describen QUÉ testean, no CÓMO
- Un test por caso: No combinar múltiples afirmaciones en un solo test
- Edge cases: Incluir inputs vacíos, null, valores límites, casos de error

---

*Generated by Clavix /clavix-plan*
