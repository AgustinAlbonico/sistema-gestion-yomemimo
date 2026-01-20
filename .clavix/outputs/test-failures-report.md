# Reporte de Fallos de Tests - NexoPOS

**Fecha**: 2026-01-18
**Ejecución**: Tests Unitarios Backend
**Resultado**: 3 test suites fallidas, 8 pasadas, 168 tests totales

---

## Resumen Ejecutivo

| Estado | Cantidad |
|--------|----------|
| Test Suites Pasadas | 8 |
| Test Suites Fallidas | 3 |
| Tests Pasados | 163 |
| Tests Fallidos | 5 |
| Tiempo de Ejecución | ~369s |

**Test Suites con Problemas:**
1. `sales.service.spec.ts` - Error de compilación TypeScript
2. `cash-register.service.spec.ts` - 4 tests failing por expectativas incorrectas
3. `customer-accounts.service.spec.ts` - Error de memoria (heap out of memory)

---

## Análisis Detallado de Fallos

### 1. sales.service.spec.ts - Error de Importación

**Archivo**: `apps/backend/src/modules/sales/sales.service.spec.ts`

**Error TypeScript:**
```
TS2307: Cannot find module 'c:/Users/agust/Desktop/Proyectos/sistema-gestion/apps/backend/test/factories/sale.mock.factory'
```

**Causa Raíz:**
- La línea 22 tiene un import con ruta absoluta incorrecta
- El archivo `sale.mock.factory.ts` existe en `src/test/factories/` no en `test/factories/`
- La función `createMockSale` se importa pero nunca se usa en el código

**Problemas Adicionales de Tipo:**
- Línea 188: `Type 'unknown' is not assignable to type 'Partial<Sale> | null'`
- Línea 338: Los objetos mock de `items` no tienen todas las propiedades requeridas por `SaleItem`
- Línea 415: El objeto mock de `invoice` no tiene todas las propiedades requeridas por `Invoice`

**Plan de Corrección:**

1. **Eliminar el import incorrecto (línea 22):**
   ```typescript
   // ELIMINAR esta línea:
   import { createMockSale } from 'c:/Users/agust/Desktop/Proyectos/sistema-gestion/apps/backend/test/factories/sale.mock.factory';
   ```

2. **Corregir el tipado de `mockCompletedSaleForFindOne`:**
   ```typescript
   // CAMBIAR:
   let mockCompletedSaleForFindOne: Partial<Sale> | null = null;

   // POR:
   let mockCompletedSaleForFindOne: Partial<Sale> | null = null;
   // Y al asignar, usar 'as Partial<Sale>':
   mockCompletedSaleForFindOne = mockCompletedSale as Partial<Sale>;
   ```

3. **Mejorar los mocks para que cumplan con las interfaces:**
   ```typescript
   const mockCompletedSale = {
       id: 'sale-1',
       saleNumber: 'VENTA-2026-00001',
       status: SaleStatus.COMPLETED,
       saleDate: new Date(),
       items: [{
           id: 'item-1',
           productId: 'product-1',
           quantity: 1,
           unitPrice: 100,
           saleId: 'sale-1',
           // Propiedades requeridas por SaleItem
           sale: {} as Sale,
           product: {} as Product,
           productCode: 'SKU1',
           productDescription: 'Producto Test',
           discount: 0,
           discountPercent: 0,
           subtotal: 100,
       }] as SaleItem[],
       payments: [] as SalePayment[],
       customer: null,
       createdBy: null,
       invoice: null,
   } as Partial<Sale>;
   ```

---

### 2. cash-register.service.spec.ts - Expectativas Incorrectas

**Archivo**: `apps/backend/src/modules/cash-register/cash-register.service.spec.ts`

**Tests Fallidos:**

#### 2.1. "debe abrir una caja cuando no hay abierta"

**Error:**
```
Expected: ObjectContaining {"action": "OPEN", "entityType": "CASH_REGISTER"}
Received: {"action": "OPEN", "description": "Apertura de caja", "entityId": "cash-1", "entityType": "cash_register", "newValues": {...}, "userId": "user-1"}
```

**Causa:** El test espera `entityType: 'CASH_REGISTER'` (con guion bajo y mayúsculas) pero el servicio envía `entityType: 'cash_register'` (con minúsculas y guion).

**Solución:**
```typescript
// CAMBIAR el test en cash-register.service.spec.ts línea 138-143:
expect(mockAuditService.logSilent).toHaveBeenCalledWith(
    expect.objectContaining({
        entityType: 'cash_register',  // ← Cambiar a minúsculas con guion
        action: 'OPEN',
    })
);
```

#### 2.2. "debe lanzar error si ya hay caja abierta"

**Error:**
```
Expected message: "Ya existe una caja abierta"
Received message: "Cannot read properties of undefined (reading 'leftJoinAndSelect')"
```

**Causa:** El mock `mockCashMovementRepository.createQueryBuilder` no está configurado correctamente para devolver un query builder encadenable.

**Solución:**
```typescript
// AGREGAR en la sección de mock declarations (antes del describe):
const mockCashMovementRepository = {
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
    })),
};
```

#### 2.3. "debe lanzar error si ya existe caja cerrada hoy"

**Error:**
```
Expected message: "Ya existe una caja cerrada para el día de hoy"
Received message: "Ya existe una caja cerrada para el día de hoy. Debe reabrirla para continuar operando."
```

**Causa:** El mensaje de error del servicio cambió pero el test no se actualizó.

**Solución:**
```typescript
// CAMBIAR en la línea 159-161:
await expect(service.open({ initialAmount: 10000 }, 'user-1')).rejects.toThrow(
    'Ya existe una caja cerrada para el día de hoy. Debe reabrirla para continuar operando.'
);
```

#### 2.4. "debe limpiar datos de cierre al reabrir"

**Error:**
```
expect(received).toBeNull()
Received: undefined
```

**Causa:** Al reabrir una caja, las propiedades `actualAmount` y `difference` se establecen en `undefined` no en `null`.

**Solución:**
```typescript
// CAMBIAR en la línea 319:
expect(total.actualAmount).toBeUndefined();  // Cambiar de toBeNull() a toBeUndefined()
expect(total.difference).toBeUndefined();
```

---

### 3. customer-accounts.service.spec.ts - Error de Memoria

**Archivo**: `apps/backend/src/modules/customer-accounts/customer-accounts.service.spec.ts`

**Error:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
A jest worker process (pid=21260) was terminated by another process
```

**Causa Raíz:** El test está consumiendo demasiada memoria, probablemente debido a:
1. Mocks mal configurados que causan loops infinitos
2. Múltiples llamadas a `mockResolvedValue` sin proper cleanup
3. Arrays o objetos que crecen sin límite en los tests

**Plan de Investigación:**

1. **Revisar si hay leaks de memoria en los mocks:**
   ```typescript
   afterEach(() => {
       jest.clearAllMocks();
       jest.resetAllMocks();  // Agregar resetAllMocks
   });
   ```

2. **Verificar si el beforeEach está creando mocks que no se limpian:**
   - Buscar arrays o Maps que crecen en cada test
   - Verificar que no haya referencias circulares

3. **Considerar aumentar el límite de memoria para Jest temporalmente:**
   ```json
   // package.json
   "test:unit": "jest --selectProjects unit --logHeapUsage"
   ```

---

## Priorización de Correcciones

### Alta Prioridad (Bloquean ejecución completa)

| Archivo | Problema | Estimado |
|---------|----------|----------|
| `sales.service.spec.ts` | Import incorrecto | 5 min |
| `cash-register.service.spec.ts` | 4 tests con expectativas incorrectas | 15 min |

### Media Prioridad (Requieren investigación)

| Archivo | Problema | Estimado |
|---------|----------|----------|
| `customer-accounts.service.spec.ts` | Memory leak | 30 min |

---

## Archivos a Modificar

1. `apps/backend/src/modules/sales/sales.service.spec.ts`
   - Línea 22: Eliminar import incorrecto
   - Línea 188, 338, 415: Corregir tipos de mocks

2. `apps/backend/src/modules/cash-register/cash-register.service.spec.ts`
   - Líneas 26-35: Agregar mock completo de createQueryBuilder
   - Línea 140: Cambiar `CASH_REGISTER` → `cash_register`
   - Línea 217: Cambiar `CASH_REGISTER` → `cash_register`
   - Línea 160: Actualizar mensaje de error esperado
   - Línea 319-320: Cambiar `toBeNull()` → `toBeUndefined()`

3. `apps/backend/src/modules/customer-accounts/customer-accounts.service.spec.ts`
   - Investigar y corregir memory leak

---

## Tests de Integración (Backend)

**Estado**: No ejecutables - Requieren PostgreSQL en Docker

**Error**: `AggregateError` - Conexión a base de datos fallida

**Requisitos para ejecutar:**
```bash
# Iniciar PostgreSQL de test
docker-compose -f docker-compose.test.yml up -d

# Ejecutar tests
cd apps/backend
npm run test:integration
```

**Archivos de integración encontrados:** ✅ Estructura correcta
- `test/integration/sales-cash-register.integration.spec.ts`
- `test/integration/customer-accounts.integration.spec.ts`
- `test/integration/incomes-expenses.integration.spec.ts`

---

## Tests E2E (Frontend)

**Estado**: No ejecutables - Requieren aplicación corriendo

**Error**: `net::ERR_CONNECTION_REFUSED at http://localhost:5173`

**Requisitos para ejecutar:**
```bash
# Terminal 1: Iniciar backend
cd apps/backend
npm run start:dev

# Terminal 2: Iniciar frontend
cd apps/frontend
npm run dev

# Terminal 3: Ejecutar tests E2E
cd apps/frontend
npm run test:e2e
```

**Archivos E2E encontrados:** ✅ Estructura correcta (13 archivos)
- `e2e/tests/auth.spec.ts`
- `e2e/tests/products.spec.ts`
- `e2e/tests/customers.spec.ts`
- `e2e/tests/dashboard.spec.ts`
- `e2e/tests/navigation.spec.ts`
- `e2e/tests/suppliers.spec.ts`
- `e2e/tests/purchases.spec.ts`
- `e2e/tests/data-freshness.spec.ts`
- `e2e/tests/cash-register.spec.ts`
- `e2e/tests/expenses.spec.ts`
- `e2e/tests/sales.spec.ts`
- `e2e/tests/incomes.spec.ts`
- `e2e/tests/customer-accounts.spec.ts`

---

## Validación de Estructura según Guía (`docs/testing/guia-tests.md`)

### Convenciones de Nomenclatura

| Convención | Estado | Notas |
|------------|--------|-------|
| Unit tests: `*.spec.ts` junto al código | ✅ | 11 archivos en `src/modules/**/*.spec.ts` |
| Integration: `*.integration.spec.ts` | ⚠️ | Archivos nombrados como `*.spec.ts` en lugar de `*.integration.spec.ts` |
| E2E: `*.spec.ts` en `e2e/tests/` | ✅ | 13 archivos |
| Factories: `*.factory.ts` en `test/factories/` | ✅ | 7 factories + index |

**Observación**: Los tests de integración están nombrados como `*.spec.ts` en lugar de `*.integration.spec.ts` según la guía. No es crítico pero para consistencia debería ajustarse.

### Naming de Tests

| Tipo | Patrón | Estado |
|------|--------|--------|
| Backend unit tests | `debe [acción] cuando [condición]` | ✅ 133 ocurrencias |
| Frontend E2E | `debe [acción] cuando [condición]` | ❌ No usa este patrón |

**Observación**: Los tests E2E del frontend no siguen el patrón de nomenclatura de la guía. Usan nombres más cortos descriptivos.

### Ubicación de Archivos

| Tipo | Ubicación esperada | Estado |
|------|-------------------|--------|
| Unit tests | `apps/backend/src/**/*.spec.ts` | ✅ Correcto |
| Integration | `apps/backend/test/integration/*.integration.spec.ts` | ⚠️ Extension `.spec.ts` |
| E2E | `apps/frontend/e2e/tests/*.spec.ts` | ✅ Correcto |
| Factories | `apps/backend/test/factories/*.factory.ts` | ✅ Correcto |

### Estructura de Tests (describe/it)

**Backend**: ✅ Usa `describe/it` con `beforeEach/beforeAll/afterEach/afterAll`
**Frontend E2E**: ✅ Usa `test.describe/test` con `beforeEach`

---

## Resumen Final de Ejecución

| Tipo | Tests | Pasaron | Fallaron | Estado |
|------|-------|---------|----------|--------|
| Unit (Backend) | 168 | 163 | 5 | ⚠️ 3 suites con errores |
| Integration (Backend) | 3 | 0 | 3 | ⏸️ Requiere Docker |
| E2E (Frontend) | 143 | 0 | 1 (setup) | ⏸️ Requiere app corriendo |

**Cobertura**: No ejecutada - Bloqueada por errores de compilación en unit tests

---

## Recomendaciones de Mejora

### 1. Corregir Tests Unitarios (Alta Prioridad)
Los 5 tests fallidos tienen soluciones claras documentadas arriba. Estimado: 20 minutos

### 2. Ajustar Nomenclatura de Integration Tests (Media Prioridad)
Renombrar archivos para consistencia:
```bash
# Renombrar
sales-cash-register.integration.spec.ts → sales-cash-register.spec.ts
# O agregar prefijo correctamente
```

### 3. Configurar CI/CD para Tests (Baja Prioridad)
- Ejecutar unit tests en cada PR
- Ejecutar integration tests con Docker en CI
- Ejecutar E2E tests en despliegues

### 4. Memory Leak en customer-accounts (Media Prioridad)
Investigar la causa raíz del consumo excesivo de memoria. Posibles causas:
- Mocks con referencias circulares
- Queries que no cierran properly
- Arrays que crecen sin límite

---

## Conclusión

**Estado General de Testing**: ⚠️ **PARCIALMENTE FUNCIONAL**

**Puntos Fuertes:**
- 163/168 tests unitarios pasan (97%)
- Estructura de archivos mayormente correcta
- Naming conventions seguidas en backend

**Puntos a Mejorar:**
- 3 test suites con errores corregibles
- Tests de integración y E2E requieren setup adicional
- Cobertura no medida debido a errores de compilación

---

*Reporte generado automáticamente por Clavix Implementation Mode*
*Última actualización: 2026-01-18*
