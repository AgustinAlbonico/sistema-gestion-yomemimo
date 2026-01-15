# Estrategia de Testing Anti-Regresión - NexoPOS

> **Versión**: 1.0  
> **Última actualización**: 2026-01-11  
> **Stack**: NestJS (Backend) + React/Vite (Frontend) + PostgreSQL + Electron

---

## 1. Resumen Ejecutivo

### Propósito
Este documento define la estrategia de testing para NexoPOS, un sistema POS de escritorio que evoluciona rápidamente mediante "vibecoding". El objetivo principal es **detectar regresiones en menos de 5 minutos** después de cada cambio, con el menor costo de mantenimiento posible.

### Riesgos Principales
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Romper ventas/facturación | **Crítico** - Pérdida de dinero | E2E en flujo de venta completo |
| Inconsistencia de inventario | **Alto** - Datos corruptos | Integration tests en stock movements |
| Fallas en cuentas corrientes | **Alto** - Deuda incorrecta | Unit tests exhaustivos en cálculos |
| Migraciones que rompen BD | **Crítico** - App no arranca | Test de migración en BD limpia |
| UI que no responde | **Medio** - UX degradada | Smoke tests en flujos principales |

### Principios Rectores
1. **Fail fast**: El 80% de los bugs deben detectarse en < 2 minutos (unit + integration)
2. **Costo/beneficio**: Cada test debe justificar su tiempo de ejecución
3. **Determinismo**: Cero tolerancia a flaky tests en la suite principal
4. **Cobertura útil**: Medir líneas críticas, no vanity metrics

---

## 2. Pirámide de Tests

```
                    ┌─────────┐
                    │   E2E   │
                    │  (UI)   │
                ┌───┴─────────┴───┐
                │   API/Contract  │
                │      Tests      │
            ┌───┴─────────────────┴───┐
            │    Integration Tests    │ 
            │   (Service + DB real)   │ 
        ┌───┴─────────────────────────┴───┐
        │          Unit Tests             │  
        │   (Lógica pura, sin I/O)        │ 
        └─────────────────────────────────┘
```

### Distribución por Capa

| Capa | % del Total | Tiempo Target | Ejecutar en |
|------|-------------|---------------|-------------|
| Unit | 50% | < 10 seg | Cada save (watch mode) |
| Integration | 30% | < 1 min | Cada commit |
| API/Contract | 15% | < 30 seg | Cada PR |
| E2E | 5% | < 2 min | Pre-merge + Nightly |

---

## 3. Qué Testear en Cada Capa

### 3.1 Unit Tests

**SÍ testear:**
- Cálculos de precios, márgenes, totales
- Validaciones de DTOs
- Transformaciones de datos
- Lógica de negocio en servicios (mockeando repos)
- Guards y decorators
- Utilidades y helpers

**NO testear:**
- Queries de TypeORM (eso va en integration)
- Configuración de módulos NestJS
- Imports/exports

**Ejemplos concretos:**
```typescript
// ✅ Unit test - Cálculo de precio
describe('ProductsService.calculatePrice', () => {
  it('aplica margen correctamente', () => {
    expect(service.calculatePrice(100, 30)).toBe(130);
  });
  
  it('redondea a 2 decimales', () => {
    expect(service.calculatePrice(100.555, 33.333)).toBe(134.07);
  });
});

// ✅ Unit test - Validación
describe('CreateSaleDTO', () => {
  it('rechaza items vacíos', async () => {
    const dto = { items: [], customerId: null };
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
```

### 3.2 Integration Tests

**SÍ testear:**
- Repositorios con BD real (PostgreSQL en Docker)
- Servicios que combinan múltiples repos
- Transacciones y rollbacks
- Migraciones aplicadas correctamente
- Cascadas de eliminación

**NO testear:**
- Lógica ya cubierta por unit tests
- HTTP layer (eso va en API tests)

**Ejemplos concretos:**
```typescript
// ✅ Integration test - Repositorio
describe('SalesRepository', () => {
  it('crea venta con items y actualiza stock', async () => {
    const sale = await salesRepo.createWithItems({...});
    
    expect(sale.id).toBeDefined();
    expect(sale.items).toHaveLength(2);
    
    const product = await productsRepo.findOne(productId);
    expect(product.stock).toBe(originalStock - quantity);
  });
});

// ✅ Integration test - Transacción
describe('CustomerAccountsService', () => {
  it('revierte todo si falla el movimiento', async () => {
    await expect(
      service.addCharge(invalidAccountId, 100)
    ).rejects.toThrow();
    
    // Verificar que no quedó registro parcial
    const movements = await movementsRepo.find();
    expect(movements).toHaveLength(0);
  });
});
```

### 3.3 API/Contract Tests

**SÍ testear:**
- Endpoints responden con estructura correcta
- Status codes apropiados
- Autenticación y autorización
- Validación de inputs en controller
- Headers y content-type

**NO testear:**
- Lógica de negocio (ya cubierta)
- Casos edge de datos (cubiertos en integration)

**Ejemplos concretos:**
```typescript
// ✅ API test - Contrato
describe('POST /api/sales', () => {
  it('retorna 201 con estructura correcta', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${token}`)
      .send(validSaleDTO);
    
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      saleNumber: expect.stringMatching(/^V-\d+$/),
      total: expect.any(Number),
    });
  });
  
  it('retorna 401 sin token', async () => {
    const res = await request(app).post('/api/sales').send({});
    expect(res.status).toBe(401);
  });
});
```

### 3.4 E2E Tests (UI)

**SÍ testear:**
- Flujo de venta completo (happy path)
- Login/logout
- Apertura/cierre de caja
- Creación de producto básico

**NO testear:**
- Variaciones de datos (cubiertas abajo)
- Estilos CSS
- Animaciones

**Ejemplos concretos:**
```typescript
// ✅ E2E - Flujo crítico
describe('Flujo de Venta', () => {
  it('completa venta con cliente y efectivo', async () => {
    await loginAs('vendedor');
    await openCashRegister(1000);
    
    await searchProduct('Coca Cola');
    await addToCart(2);
    await selectCustomer('Juan Pérez');
    await selectPaymentMethod('Efectivo');
    await completeSale();
    
    await expect(page.locator('.sale-success')).toBeVisible();
    await expect(page.locator('.sale-number')).toContainText('V-');
  });
});
```

---

## 4. Estrategia Anti-Regresión

### 4.1 Flujos Críticos (Nunca Romper)

| Prioridad | Flujo | Tests Mínimos |
|-----------|-------|---------------|
| P0 | Crear venta → Descontar stock → Registrar pago | 1 E2E + 3 Integration |
| P0 | Login/Logout | 1 E2E + 2 API |
| P0 | Apertura/Cierre de caja | 1 E2E + 2 Integration |
| P1 | CRUD Productos | 4 API tests |
| P1 | Cuenta corriente: cargo + pago | 2 Integration |
| P1 | Facturación AFIP | 3 Integration (mock AFIP) |
| P2 | Reportes de ventas | 2 Integration |
| P2 | Backup/Restore | 1 Integration |

### 4.2 Happy Path vs Edge Cases

```
Happy Path (obligatorio):
├── Venta con 1 producto, efectivo, sin cliente
├── Venta con múltiples productos, tarjeta, con cliente
├── Venta a cuenta corriente
└── Venta con descuento

Edge Cases (según riesgo):
├── [ALTO] Stock insuficiente → debe rechazar
├── [ALTO] Monto negativo → debe rechazar
├── [MEDIO] Cliente con límite de crédito excedido
├── [MEDIO] Producto inactivo → no debe aparecer
└── [BAJO] Nombre de producto con caracteres especiales
```

### 4.3 Matriz de Priorización

```
          IMPACTO
            Alto    │    Medio    │    Bajo
    ┌───────────────┼─────────────┼─────────────┐
Alto│  CRÍTICO      │  IMPORTANTE │  MODERADO   │
    │  Test E2E +   │  Integration│  Unit test  │
    │  Integration  │  + Unit     │             │
R   ├───────────────┼─────────────┼─────────────┤
I   │  IMPORTANTE   │  MODERADO   │  BAJO       │
E   │  Integration  │  Unit test  │  Opcional   │
S   │  + Unit       │             │             │
G   ├───────────────┼─────────────┼─────────────┤
O   │  MODERADO     │  BAJO       │  IGNORAR    │
    │  Unit test    │  Opcional   │  No testear │
Bajo│               │             │             │
    └───────────────┴─────────────┴─────────────┘
```

### 4.4 Evitar Tests Frágiles

| Problema | Solución |
|----------|----------|
| Selectores CSS frágiles | Usar `data-testid` exclusivos |
| Tiempos hardcodeados | Usar `waitFor` con condición |
| Datos aleatorios | Factories con seeds fijos |
| Orden de ejecución | Cada test resetea su estado |
| Fechas del sistema | Mockear `Date.now()` |
| IDs autogenerados | Comparar por propiedades, no por ID |

---

## 5. Estructura del Proyecto de Tests

```
apps/
├── backend/
│   ├── src/
│   │   └── modules/
│   │       └── sales/
│   │           ├── sales.service.ts
│   │           └── sales.service.spec.ts      # Unit tests colocados
│   └── test/
│       ├── setup.ts                           # Config global Jest
│       ├── factories/                         # Factories de datos
│       │   ├── product.factory.ts
│       │   ├── sale.factory.ts
│       │   └── user.factory.ts
│       ├── fixtures/                          # Datos estáticos
│       │   └── afip-responses.json
│       ├── integration/                       # Integration tests
│       │   ├── sales.integration.spec.ts
│       │   └── inventory.integration.spec.ts
│       └── api/                               # API/Contract tests
│           ├── sales.api.spec.ts
│           └── auth.api.spec.ts
│
├── frontend/
│   ├── src/
│   │   └── features/
│   │       └── sales/
│   │           └── components/
│   │               └── SaleForm.test.tsx      # Component tests
│   └── e2e/
│       ├── fixtures/
│       │   └── test-user.json
│       ├── pages/                             # Page Objects
│       │   ├── LoginPage.ts
│       │   └── SalesPage.ts
│       └── specs/
│           ├── sale-flow.spec.ts
│           └── cash-register.spec.ts
│
└── shared/
    └── test-utils/
        ├── db-helpers.ts                      # Reset BD entre tests
        └── auth-helpers.ts                    # Login helpers
```

### Naming Conventions

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Unit test | `*.spec.ts` | `sales.service.spec.ts` |
| Integration | `*.integration.spec.ts` | `sales.integration.spec.ts` |
| API test | `*.api.spec.ts` | `sales.api.spec.ts` |
| E2E | `*.e2e.spec.ts` | `sale-flow.e2e.spec.ts` |
| Factory | `*.factory.ts` | `product.factory.ts` |
| Page Object | `*Page.ts` | `SalesPage.ts` |

### Factories (Ejemplo)

```typescript
// test/factories/product.factory.ts
import { faker } from '@faker-js/faker';

export const createProductDTO = (overrides = {}) => ({
  name: faker.commerce.productName(),
  cost: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
  categoryId: null,
  brandName: null,
  stock: faker.number.int({ min: 0, max: 100 }),
  ...overrides,
});

export const createProduct = async (repo, overrides = {}) => {
  const dto = createProductDTO(overrides);
  return repo.save(repo.create(dto));
};
```

---

## 6. Ejecución en CI/CD

### 6.1 Gates por Etapa

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ═══════════════════════════════════════════
  # GATE 1: Unit Tests (< 30 seg) - BLOQUEANTE
  # ═══════════════════════════════════════════
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage $COVERAGE% < 70%"
            exit 1
          fi

  # ═══════════════════════════════════════════
  # GATE 2: Integration Tests (< 2 min) - BLOQUEANTE
  # ═══════════════════════════════════════════
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: test
    steps:
      - run: npm run test:integration

  # ═══════════════════════════════════════════
  # GATE 3: API Tests (< 1 min) - BLOQUEANTE
  # ═══════════════════════════════════════════
  api-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - run: npm run test:api

  # ═══════════════════════════════════════════
  # GATE 4: E2E (< 5 min) - Solo en PR a main
  # ═══════════════════════════════════════════
  e2e-tests:
    if: github.base_ref == 'main'
    runs-on: ubuntu-latest
    needs: api-tests
    steps:
      - run: npm run test:e2e

  # ═══════════════════════════════════════════
  # NIGHTLY: Suite completa + Regresión
  # ═══════════════════════════════════════════
  nightly:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:all
      - run: npm run test:e2e:full
```

### 6.2 Thresholds Recomendados

| Métrica | Threshold | Acción si falla |
|---------|-----------|-----------------|
| Coverage líneas | ≥ 70% | Bloquear merge |
| Coverage branches | ≥ 60% | Warning |
| Unit tests pasando | 100% | Bloquear merge |
| Integration pasando | 100% | Bloquear merge |
| E2E críticos pasando | 100% | Bloquear merge a main |
| Tiempo total pipeline | < 10 min | Optimizar |
| Flaky rate | < 2% | Cuarentena automática |

---

## 7. Gestión de Flakiness

### 7.1 Detección Automática

```typescript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['jest-flaky-reporter', {
      threshold: 3,  // 3 fallas en 10 runs = flaky
      quarantineFile: '.flaky-tests.json'
    }]
  ]
};
```

### 7.2 Sistema de Cuarentena

```json
// .flaky-tests.json (auto-generado)
{
  "quarantined": [
    {
      "name": "SalesPage renders loading state",
      "file": "SalesPage.test.tsx",
      "failureRate": 0.15,
      "lastFailure": "2026-01-10",
      "owner": "@agustin"
    }
  ]
}
```

### 7.3 Reglas de Estabilización

| Causa | Solución |
|-------|----------|
| Timing issues | `waitFor` con timeout explícito |
| Race conditions | `await` todos los efectos |
| Datos compartidos | Isolation por test |
| Network delays | Interceptar con MSW |
| Animaciones | Deshabilitar en test mode |

```typescript
// ❌ INCORRECTO - Timing frágil
await page.click('.submit');
await page.waitForTimeout(1000);
expect(await page.locator('.success').count()).toBe(1);

// ✅ CORRECTO - Condición explícita
await page.click('.submit');
await expect(page.locator('.success')).toBeVisible({ timeout: 5000 });
```

---

## 8. Roadmap de Implementación

### Fase 1: Fundamentos (Semana 1-2)

| Día | Tarea | Entregable |
|-----|-------|------------|
| 1-2 | Setup Jest + config | `jest.config.js` funcionando |
| 3 | Crear factories básicas | `product`, `sale`, `user` factories |
| 4-5 | 10 unit tests en `SalesService` | Coverage 50% del módulo |
| 6-7 | 5 integration tests críticos | Venta + Stock integrado |
| 8-10 | Setup PostgreSQL en CI | Pipeline verde |

**Quick Wins:**
- [ ] Test de `calculatePrice()` - 5 min
- [ ] Test de `validateSaleDTO()` - 10 min
- [ ] Test de login API - 15 min

### Fase 2: Cobertura Core (Semana 3-4)

| Tarea | Tests |
|-------|-------|
| Completar unit tests de servicios core | +50 tests |
| API tests para todos los endpoints CRUD | +30 tests |
| Integration tests de cuentas corrientes | +10 tests |
| Primer E2E: flujo de venta | 1 test |

### Fase 3: Madurez (Semana 5-8)

| Tarea | Tests |
|-------|-------|
| E2E para flujos P0 y P1 | +5 tests |
| Mutation testing (Stryker) | Baseline |
| Flaky detection activo | Sistema funcionando |
| Coverage gates en CI | Thresholds activos |

### Definition of Done para Features Nuevas

Una feature está **DONE** cuando:
- [ ] Unit tests para lógica nueva (coverage ≥ 80%)
- [ ] Integration test si toca BD
- [ ] API test si expone endpoint
- [ ] E2E si es flujo crítico nuevo
- [ ] Tests pasan en CI
- [ ] No introduce flaky tests

---

## 9. Checklist Operativo

### ¿Qué tests debo agregar?

```
┌─────────────────────────────────────────────────────────┐
│  ¿El cambio afecta cálculos/lógica de negocio?          │
│     SÍ → Unit test obligatorio                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ¿El cambio toca la BD (queries, relaciones)?           │
│     SÍ → Integration test obligatorio                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ¿El cambio modifica un endpoint (request/response)?    │
│     SÍ → API test obligatorio                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ¿El cambio afecta un flujo P0/P1?                      │
│     SÍ → Verificar E2E existente o crear nuevo          │
└─────────────────────────────────────────────────────────┘
```

### Decisión de Capa

| Si el test necesita... | Capa correcta |
|------------------------|---------------|
| Mockear todo | Unit |
| BD real pero sin HTTP | Integration |
| HTTP real pero BD en memoria | API |
| Browser real | E2E |

---

## 10. Métricas y Observabilidad

### Dashboard de Quality Gate

| Métrica | Fórmula | Target | Alerta |
|---------|---------|--------|--------|
| Coverage útil | Líneas críticas cubiertas / Total críticas | ≥ 85% | < 75% |
| Tiempo de pipeline | Fin - Inicio | < 10 min | > 15 min |
| Flaky rate | Tests flaky / Total tests | < 2% | > 5% |
| Regresiones detectadas en CI | Bugs encontrados antes de merge | Trending ↑ | N/A |
| Regresiones en producción | Bugs después de deploy | Trending ↓ | > 1/semana |

### Alertas Automáticas

```yaml
# Ejemplo Slack webhook en CI
- name: Alert on coverage drop
  if: ${{ env.COVERAGE_DROPPED == 'true' }}
  run: |
    curl -X POST $SLACK_WEBHOOK -d '{
      "text": "⚠️ Coverage bajó de $OLD% a $NEW%"
    }'
```

---

## 11. Cómo Testear Cambios Futuros Sin Romper

### 11.1 Refactors

**Regla de oro**: Los tests NO deben cambiar si el refactor no cambia comportamiento.

```typescript
// Antes del refactor
it('calcula total correctamente', () => {
  expect(service.calculateTotal(items)).toBe(150);
});

// Después del refactor (mismo test, mismo resultado)
it('calcula total correctamente', () => {
  expect(service.calculateTotal(items)).toBe(150); // ✅ Pasa = refactor seguro
});
```

**Proceso:**
1. Correr tests antes del refactor
2. Hacer refactor
3. Correr mismos tests sin modificarlos
4. Si pasan → refactor exitoso
5. Si fallan → bug introducido

### 11.2 Cambios en BD (Migraciones)

**Checklist obligatorio:**
- [ ] Test de migración en BD vacía
- [ ] Test de migración con datos existentes
- [ ] Test de rollback
- [ ] Verificar que app arranca post-migración

```typescript
describe('Migration: AddBrandsSupport', () => {
  it('aplica en BD vacía sin error', async () => {
    await runMigration('AddBrandsSupport1768003658000');
    const columns = await getTableColumns('brands');
    expect(columns).toContain('name');
  });
  
  it('preserva datos existentes de products', async () => {
    // Setup: crear producto sin marca
    await seedProducts([{ name: 'Test', brandId: null }]);
    
    // Act: correr migración
    await runMigration('AddBrandsSupport1768003658000');
    
    // Assert: producto sigue existiendo
    const product = await productsRepo.findOne({ name: 'Test' });
    expect(product).toBeDefined();
  });
});
```

### 11.3 Cambios en Endpoints

**Estrategia de backward compatibility:**

```typescript
// API test que detecta breaking changes
describe('GET /api/products', () => {
  it('mantiene estructura de respuesta v1', async () => {
    const res = await request(app).get('/api/products');
    
    // Schema validator detecta cambios
    expect(res.body).toMatchSchema({
      type: 'object',
      required: ['data', 'total', 'page'],
      properties: {
        data: {
          type: 'array',
          items: {
            required: ['id', 'name', 'price'], // Campos obligatorios
          }
        }
      }
    });
  });
});
```

**Si necesitás un breaking change:**
1. Crear endpoint v2 (`/api/v2/products`)
2. Deprecar v1 con header `Deprecation: true`
3. Migrar clientes
4. Eliminar v1 cuando no tenga tráfico

### 11.4 Cambios en UI

**Protección contra regresiones visuales:**

```typescript
// Component test - Comportamiento, no estilos
describe('ProductCard', () => {
  it('muestra nombre y precio', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Coca Cola')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });
  
  it('llama onAdd al hacer click', () => {
    const onAdd = jest.fn();
    render(<ProductCard product={mockProduct} onAdd={onAdd} />);
    
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    expect(onAdd).toHaveBeenCalledWith(mockProduct);
  });
});
```

**Regla para selectores:**
```tsx
// ❌ FRÁGIL - Selector de implementación
<button className="btn btn-primary add-to-cart">

// ✅ ESTABLE - Selector semántico
<button data-testid="add-to-cart-btn">
```

### 11.5 Agregado de Features

**Feature Flag + Testing:**

```typescript
// Nueva feature con flag
if (featureFlags.enableBrands) {
  // Código nuevo
}

// Tests aislados por feature
describe('Brands Feature', () => {
  beforeEach(() => {
    enableFeatureFlag('brands');
  });
  
  afterEach(() => {
    disableFeatureFlag('brands');
  });
  
  it('muestra selector de marca en producto', () => {
    // Test solo corre cuando feature está activa
  });
});

// Regression test - feature apagada no rompe nada
describe('Products without Brands', () => {
  beforeEach(() => {
    disableFeatureFlag('brands');
  });
  
  it('crea producto sin marca correctamente', () => {
    // Comportamiento original sigue funcionando
  });
});
```

---

## Apéndice: Preguntas para Refinar

Si necesitás que ajuste esta estrategia, respondeme:

1. **¿Usás Docker para development?** (Afecta setup de integration tests)
2. **¿Tenés entorno de staging?** (Afecta estrategia de smoke tests)
3. **¿Cuántos desarrolladores hay?** (Afecta ownership y priorización)
4. **¿Hay algún módulo que cambie más frecuentemente?** (Para priorizar cobertura)
5. **¿Usás algún tool de testing actualmente?** (Para migración gradual)
