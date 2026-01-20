# Guía Completa de Testing - Sistema de Gestión

> **Última actualización**: 2026-01-17  
> **Sistema**: NexoPOS - Sistema de Gestión POS  
> **Stack**: NestJS (Backend) + React/Vite (Frontend) + PostgreSQL + Playwright

---

## 📋 Índice

1. [Tipos de Tests](#tipos-de-tests)
2. [Tests Unitarios (Unit Tests)](#tests-unitarios)
3. [Tests de Integración (Integration Tests)](#tests-de-integración)
4. [Tests API/Contract](#tests-api-contract)
5. [Tests E2E (End-to-End)](#tests-e2e)
6. [Estructura de Archivos](#estructura-de-archivos)
7. [Comandos Disponibles](#comandos-disponibles)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Troubleshooting](#troubleshooting)

---

## Tipos de Tests

El sistema implementa una **pirámide de testing** con 4 capas:

```
                 ┌─────────┐
                 │   E2E   │  5% - Flujos críticos completos
                 │  (UI)   │
             ┌───┴─────────┴───┐
             │   API/Contract  │  15% - Endpoints HTTP
             │      Tests      │
         ┌───┴─────────────────┴───┐
         │    Integration Tests    │  30% - Servicios + BD real
         │   (Service + DB real)   │
     ┌───┴─────────────────────────┴───┐
     │          Unit Tests             │  50% - Lógica pura
     │   (Lógica pura, sin I/O)        │
     └─────────────────────────────────┘
```

| Tipo | Framework | Ubicación | Cantidad | Tiempo |
|------|-----------|-----------|----------|--------|
| **Unit** | Jest | `apps/backend/src/**/*.spec.ts` | 11 archivos | < 10s |
| **Integration** | Jest + PostgreSQL | `apps/backend/test/integration/*.spec.ts` | 3 archivos | < 1min |
| **API** | Jest + Supertest | `apps/backend/test/api/*.spec.ts` | ⚠️ Pendiente | < 30s |
| **E2E** | Playwright | `apps/frontend/e2e/tests/*.spec.ts` | 13 archivos | < 2min |

---

## Tests Unitarios

### 📍 Ubicación
`apps/backend/src/**/*.spec.ts` (junto al código fuente)

### 🎯 Qué Testear

**✅ SÍ testear:**
- Cálculos de precios, márgenes, totales
- Validaciones de DTOs
- Transformaciones de datos
- Lógica de negocio en servicios (mockeando repositorios)
- Guards y decorators
- Utilidades y helpers

**❌ NO testear:**
- Queries de TypeORM (eso va en integration)
- Configuración de módulos NestJS
- Imports/exports

### 📝 Archivos Existentes

```
apps/backend/src/modules/
├── auth/auth.service.spec.ts                    (22 tests)
├── cash-register/cash-register.service.spec.ts
├── configuration/configuration.service.spec.ts  (12 tests)
├── customer-accounts/customer-accounts.service.spec.ts
├── expenses/expenses.service.spec.ts
├── incomes/incomes.service.spec.ts
├── inventory/inventory.service.spec.ts          (16 tests)
├── products/products.service.spec.ts            (17 tests)
├── sales/sales.service.spec.ts                  (14 tests)
├── suppliers/suppliers.service.spec.ts          (14 tests)
└── afip/utils/afip-error-mapper.spec.ts
```

### 💻 Ejemplo de Test Unitario

```typescript
// products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('calculatePrice', () => {
    it('debe aplicar margen correctamente', () => {
      const result = service.calculatePrice(100, 30);
      expect(result).toBe(130);
    });

    it('debe redondear a 2 decimales', () => {
      const result = service.calculatePrice(100.555, 33.333);
      expect(result).toBe(134.07);
    });
  });

  describe('findAll', () => {
    it('debe retornar array de productos', async () => {
      const mockProducts = [{ id: '1', name: 'Test' }];
      mockRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findAll();
      expect(result).toEqual(mockProducts);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });
});
```

### 🚀 Comandos

```powershell
# Ejecutar todos los tests unitarios
npm run test:unit

# Watch mode (re-ejecuta al guardar)
npm run test:watch

# Con coverage
npm run test:unit -- --coverage

# Un archivo específico
npm run test:unit -- products.service.spec.ts
```

---

## Tests de Integración

### 📍 Ubicación
`apps/backend/test/integration/*.integration.spec.ts`

### 🎯 Qué Testear

**✅ SÍ testear:**
- Repositorios con BD real (PostgreSQL en Docker)
- Servicios que combinan múltiples repositorios
- Transacciones y rollbacks
- Migraciones aplicadas correctamente
- Cascadas de eliminación
- Relaciones entre entidades

**❌ NO testear:**
- Lógica ya cubierta por unit tests
- HTTP layer (eso va en API tests)

### 📝 Archivos Existentes

```
apps/backend/test/integration/
├── customer-accounts.integration.spec.ts
├── incomes-expenses.integration.spec.ts
└── sales-cash-register.integration.spec.ts
```

### 💻 Ejemplo de Test de Integración

```typescript
// sales.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from '@/modules/sales/sales.service';
import { ProductsService } from '@/modules/products/products.service';
import { Sale } from '@/modules/sales/entities/sale.entity';
import { Product } from '@/modules/products/entities/product.entity';

describe('SalesService Integration', () => {
  let salesService: SalesService;
  let productsService: ProductsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433, // Puerto de test
          username: 'test',
          password: 'test',
          database: 'test',
          entities: [Sale, Product],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Sale, Product]),
      ],
      providers: [SalesService, ProductsService],
    }).compile();

    salesService = module.get<SalesService>(SalesService);
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('createSale', () => {
    it('debe crear venta y actualizar stock', async () => {
      // Arrange
      const product = await productsService.create({
        name: 'Test Product',
        cost: 100,
        stock: 10,
      });

      // Act
      const sale = await salesService.create({
        items: [{ productId: product.id, quantity: 2, price: 150 }],
      });

      // Assert
      expect(sale.id).toBeDefined();
      expect(sale.items).toHaveLength(1);

      const updatedProduct = await productsService.findOne(product.id);
      expect(updatedProduct.stock).toBe(8); // 10 - 2
    });

    it('debe revertir todo si falla la transacción', async () => {
      // Arrange
      const product = await productsService.create({
        name: 'Test Product',
        stock: 1,
      });

      // Act & Assert
      await expect(
        salesService.create({
          items: [{ productId: product.id, quantity: 10 }], // Stock insuficiente
        })
      ).rejects.toThrow();

      // Verificar que no quedó registro parcial
      const sales = await salesService.findAll();
      expect(sales).toHaveLength(0);
    });
  });
});
```

### 🐳 Setup de Base de Datos

**Prerequisito**: Docker instalado

```powershell
# Iniciar PostgreSQL de test
docker-compose -f docker-compose.test.yml up -d

# Verificar que está corriendo
docker ps | Select-String "postgres-test"

# Ver logs
docker-compose -f docker-compose.test.yml logs -f
```

**Configuración** (`docker-compose.test.yml`):
```yaml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
```

### 🚀 Comandos

```powershell
# Ejecutar tests de integración
npm run test:integration

# Con logs detallados
npm run test:integration -- --verbose

# Un archivo específico
npm run test:integration -- sales-cash-register
```

---

## Tests API Contract

### 📍 Ubicación
`apps/backend/test/api/*.api.spec.ts` ⚠️ **Pendiente de implementar**

### 🎯 Qué Testear

**✅ SÍ testear:**
- Endpoints responden con estructura correcta
- Status codes apropiados (200, 201, 400, 401, 404, etc.)
- Autenticación y autorización
- Validación de inputs en controller
- Headers y content-type
- Paginación y filtros

**❌ NO testear:**
- Lógica de negocio (ya cubierta en unit)
- Casos edge de datos (cubiertos en integration)

### 💻 Ejemplo de Test API (Plantilla)

```typescript
// sales.api.spec.ts
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';

describe('Sales API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login para obtener token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/sales', () => {
    it('debe retornar 201 con estructura correcta', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { productId: '1', quantity: 2, price: 100 }
          ],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        saleNumber: expect.stringMatching(/^V-\d+$/),
        total: expect.any(Number),
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: expect.any(String),
            quantity: expect.any(Number),
          })
        ]),
      });
    });

    it('debe retornar 401 sin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sales')
        .send({});

      expect(response.status).toBe(401);
    });

    it('debe retornar 400 con datos inválidos', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [] }); // Items vacío

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/sales', () => {
    it('debe retornar lista paginada', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sales?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
      });
    });
  });
});
```

### 🚀 Comandos

```powershell
# Ejecutar tests API (cuando estén implementados)
npm run test:api

# Con coverage
npm run test:api -- --coverage
```

---

## Tests E2E

### 📍 Ubicación
`apps/frontend/e2e/tests/*.spec.ts`

### 🎯 Qué Testear

**✅ SÍ testear:**
- Flujos de venta completos (happy path)
- Login/logout
- Apertura/cierre de caja
- Creación de entidades básicas (productos, clientes)
- Navegación entre páginas
- Interacciones críticas del usuario

**❌ NO testear:**
- Variaciones de datos (cubiertas en otros niveles)
- Estilos CSS
- Animaciones
- Edge cases de validación

### 📝 Archivos Existentes

```
apps/frontend/e2e/tests/
├── auth.spec.ts                  # Autenticación
├── cash-register.spec.ts         # Apertura/cierre de caja
├── customer-accounts.spec.ts     # Cuenta corriente
├── customers.spec.ts             # Gestión de clientes
├── dashboard.spec.ts             # Dashboard principal
├── data-freshness.spec.ts        # Actualización de datos
├── expenses.spec.ts              # Gestión de gastos
├── incomes.spec.ts               # Gestión de ingresos
├── navigation.spec.ts            # Navegación
├── products.spec.ts              # Gestión de productos
├── purchases.spec.ts             # Compras
├── sales.spec.ts                 # Ventas (flujo completo)
└── suppliers.spec.ts             # Proveedores
```

### 💻 Ejemplo de Test E2E

```typescript
// sales.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Flujo de Ventas', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de ventas
    await page.goto('/ventas');
    await expect(page.locator('h1')).toContainText('Ventas');
  });

  test('debe completar venta con efectivo', async ({ page }) => {
    // 1. Abrir modal de nueva venta
    await page.getByRole('button', { name: /nueva venta/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 2. Buscar y agregar producto
    await page.getByPlaceholder(/buscar producto/i).fill('Coca Cola');
    await page.getByText('Coca Cola 500ml').click();
    await page.getByRole('button', { name: /agregar/i }).click();

    // 3. Verificar que se agregó al carrito
    await expect(page.locator('.cart-item')).toContainText('Coca Cola');

    // 4. Seleccionar método de pago
    await page.getByLabel(/método de pago/i).selectOption('cash');

    // 5. Completar venta
    await page.getByRole('button', { name: /completar venta/i }).click();

    // 6. Verificar éxito
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText(/venta creada/i);

    // 7. Verificar que aparece en la lista
    await expect(page.locator('.sales-table')).toContainText('V-');
  });

  test('debe crear venta a cuenta corriente', async ({ page }) => {
    await page.getByRole('button', { name: /nueva venta/i }).click();

    // Agregar producto
    await page.getByPlaceholder(/buscar producto/i).fill('Test Product');
    await page.getByText('Test Product').click();
    await page.getByRole('button', { name: /agregar/i }).click();

    // Seleccionar cliente
    await page.getByLabel(/cliente/i).click();
    await page.getByText('Juan Pérez').click();

    // Seleccionar cuenta corriente
    await page.getByLabel(/método de pago/i).selectOption('account');

    // Completar
    await page.getByRole('button', { name: /completar venta/i }).click();

    // Verificar
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

### 🔧 Fixtures y Helpers

**`e2e/fixtures/test-fixtures.ts`**:
```typescript
import { Page } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async expectSuccessToast(message?: string) {
    const toast = this.page.locator('.toast-success');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  async createCustomer(data: { name: string; email: string }) {
    await this.page.getByRole('button', { name: /nuevo cliente/i }).click();
    await this.page.getByLabel(/nombre/i).fill(data.name);
    await this.page.getByLabel(/email/i).fill(data.email);
    await this.page.getByRole('button', { name: /guardar/i }).click();
    await this.expectSuccessToast();
  }
}
```

**`e2e/fixtures/test-data.ts`**:
```typescript
export const E2E_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
};

export const E2E_CUSTOMER = {
  name: 'Cliente Test E2E',
  email: 'test@example.com',
  phone: '1234567890',
};

export const E2E_PRODUCT = {
  name: 'Producto Test E2E',
  cost: 100,
  price: 150,
  stock: 50,
};

export const E2E_CASH_REGISTER = {
  initialAmount: 1000,
  description: 'Apertura de caja test',
};
```

### 🚀 Comandos

```powershell
# Ejecutar todos los tests E2E
npm run test:e2e

# Ver navegador (modo headed)
npm run test:e2e:headed

# Modo UI interactivo
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Ver reporte HTML
npm run test:e2e:report

# Ejecutar un archivo específico
npx playwright test e2e/tests/sales.spec.ts

# Ejecutar tests que coincidan con un patrón
npx playwright test --grep "venta con efectivo"
```

### 🔐 Autenticación

Los tests E2E usan autenticación automática configurada en `e2e/auth.setup.ts`:

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('autenticar usuario', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/usuario/i).fill('admin');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  
  await page.waitForURL('/dashboard');
  
  // Guardar estado de autenticación
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

---

## Estructura de Archivos

```
sistema-gestion/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   └── modules/
│   │   │       └── [modulo]/
│   │   │           ├── [modulo].service.ts
│   │   │           └── [modulo].service.spec.ts    # ← Unit tests
│   │   └── test/
│   │       ├── setup.ts                            # Setup global Jest
│   │       ├── setup-integration.ts                # Setup para BD
│   │       ├── factories/                          # Factories de datos
│   │       │   ├── product.factory.ts
│   │       │   ├── sale.factory.ts
│   │       │   └── user.factory.ts
│   │       ├── integration/                        # ← Integration tests
│   │       │   ├── sales.integration.spec.ts
│   │       │   └── customer-accounts.integration.spec.ts
│   │       └── api/                                # ← API tests (pendiente)
│   │           └── sales.api.spec.ts
│   │
│   └── frontend/
│       ├── e2e/                                    # ← E2E tests
│       │   ├── .auth/
│       │   │   └── user.json                       # Estado de autenticación
│       │   ├── fixtures/
│       │   │   ├── test-fixtures.ts                # Helpers
│       │   │   └── test-data.ts                    # Constantes
│       │   ├── tests/
│       │   │   ├── sales.spec.ts
│       │   │   ├── cash-register.spec.ts
│       │   │   └── ...
│       │   ├── auth.setup.ts                       # Setup de autenticación
│       │   └── playwright.config.ts
│       └── src/
│           └── components/
│               └── [Component].test.tsx            # ← Component tests (pendiente)
│
├── docs/
│   ├── coding/
│   │   └── TESTING-STRATEGY.md                     # Estrategia completa
│   ├── testing/
│   │   └── guia-tests.md                           # ← Este archivo
│   └── TESTING-PROGRESS.md                         # Progreso
│
├── docker-compose.test.yml                         # PostgreSQL para tests
└── jest.config.ts                                  # Configuración Jest
```

---

## Comandos Disponibles

### Backend

```powershell
# Tests unitarios
npm run test:unit                    # Ejecutar todos
npm run test:unit -- --watch         # Watch mode
npm run test:unit -- products        # Archivo específico

# Tests de integración
npm run test:integration             # Ejecutar todos
npm run test:integration -- sales    # Archivo específico

# Tests API (cuando estén implementados)
npm run test:api

# Todos los tests con coverage
npm run test:all

# Solo coverage sin ejecutar tests
npm run test -- --coverage --collectCoverageFrom='src/**/*.ts'
```

### Frontend

```powershell
# Tests E2E
npm run test:e2e                     # Headless
npm run test:e2e:headed              # Ver navegador
npm run test:e2e:ui                  # Modo UI
npm run test:e2e:debug               # Debug
npm run test:e2e:report              # Ver reporte

# Tests unitarios de componentes (cuando estén implementados)
npm run test                         # Vitest
npm run test -- --ui                 # Modo UI
```

### Docker

```powershell
# Iniciar BD de test
docker-compose -f docker-compose.test.yml up -d

# Detener BD de test
docker-compose -f docker-compose.test.yml down

# Ver logs
docker-compose -f docker-compose.test.yml logs -f

# Limpiar volúmenes
docker-compose -f docker-compose.test.yml down -v
```

---

## Mejores Prácticas

### ✅ Naming Conventions

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Unit test | `*.spec.ts` | `sales.service.spec.ts` |
| Integration | `*.integration.spec.ts` | `sales.integration.spec.ts` |
| API test | `*.api.spec.ts` | `sales.api.spec.ts` |
| E2E | `*.spec.ts` | `sales.spec.ts` |
| Factory | `*.factory.ts` | `product.factory.ts` |

### ✅ Estructura de Tests

```typescript
describe('NombreDelServicio', () => {
  // Setup
  let service: Service;
  let mockDependency: MockType;

  beforeEach(() => {
    // Inicialización
  });

  afterEach(() => {
    // Limpieza
  });

  describe('nombreDelMetodo', () => {
    it('debe hacer X cuando Y', () => {
      // Arrange (preparar)
      const input = { ... };
      
      // Act (ejecutar)
      const result = service.method(input);
      
      // Assert (verificar)
      expect(result).toBe(expected);
    });

    it('debe lanzar error cuando Z', () => {
      expect(() => service.method(invalid)).toThrow();
    });
  });
});
```

### ✅ Selectores en E2E

```typescript
// ❌ EVITAR - Selectores frágiles
await page.click('.btn-primary');
await page.locator('div > button:nth-child(2)').click();

// ✅ PREFERIR - Selectores semánticos
await page.getByRole('button', { name: /guardar/i }).click();
await page.getByLabel('Nombre').fill('Test');
await page.getByTestId('submit-button').click();
```

### ✅ Esperas en E2E

```typescript
// ❌ EVITAR - Timeouts fijos
await page.waitForTimeout(1000);

// ✅ PREFERIR - Esperas condicionales
await expect(page.locator('.success')).toBeVisible();
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-loaded="true"]');
```

### ✅ Aislamiento de Tests

```typescript
// Cada test debe ser independiente
describe('ProductsService', () => {
  beforeEach(async () => {
    // Limpiar BD antes de cada test
    await clearDatabase();
    // O usar transacciones que se revierten
  });

  it('test 1', () => {
    // No debe depender del orden de ejecución
  });

  it('test 2', () => {
    // No debe depender de test 1
  });
});
```

### ✅ Factories para Datos de Test

```typescript
// test/factories/product.factory.ts
export const createProductDTO = (overrides = {}) => ({
  name: 'Producto Test',
  cost: 100,
  price: 150,
  stock: 50,
  ...overrides, // Permite sobrescribir
});

// Uso en tests
const product = createProductDTO({ name: 'Custom Name' });
```

---

## Troubleshooting

### ❌ Tests de integración fallan con "Connection refused"

**Solución**: Verificar que PostgreSQL de test está corriendo

```powershell
docker ps | Select-String "postgres-test"
docker-compose -f docker-compose.test.yml up -d
```

### ❌ Tests E2E fallan con timeout

**Solución**: Aumentar timeout en `playwright.config.ts`

```typescript
export default defineConfig({
  timeout: 60000, // 60 segundos
  expect: {
    timeout: 10000, // 10 segundos para expects
  },
});
```

### ❌ "Cannot find module '@/...'"

**Solución**: Verificar configuración de paths en `jest.config.ts`

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

### ❌ Tests pasan localmente pero fallan en CI

**Causas comunes**:
- Diferencias de timezone → Mockear `Date.now()`
- Datos compartidos → Mejorar aislamiento
- Race conditions → Usar `waitFor` en vez de timeouts fijos

### ❌ Coverage bajo después de agregar tests

**Solución**: Verificar que el archivo está incluido en `collectCoverageFrom`

```typescript
// jest.config.ts
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.spec.ts',
  '!src/**/*.dto.ts',
  '!src/**/*.entity.ts',
],
```

---

## Recursos Adicionales

- 📄 [Estrategia de Testing Completa](../coding/TESTING-STRATEGY.md)
- 📄 [Progreso de Implementación](../TESTING-PROGRESS.md)
- 🔗 [Jest Documentation](https://jestjs.io/)
- 🔗 [Playwright Documentation](https://playwright.dev/)
- 🔗 [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

---

**Última actualización**: 2026-01-17  
**Mantenido por**: Equipo de Desarrollo NexoPOS
