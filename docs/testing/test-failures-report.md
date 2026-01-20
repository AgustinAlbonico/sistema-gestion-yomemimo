# Reporte de Fallos de Tests

**Generado**: 2025-01-19
**Comando**: `npm run test:all` (ejecutado en `apps/backend`)
**Entorno**: Node.js (Windows), Jest con cobertura

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Total de Tests | 194 |
| Pasados | 191 |
| Fallidos | 3 |
| Ommitidos (Skipped) | 0 |
| Test Suites | 18 |
| Suites Pasadas | 11 |
| Suites Fallidas | 7 |
| Tiempo de Ejecución | ~403 segundos |

## Tests Fallidos

### 1. Error de Tipo TypeScript en PurchasesService

- **Archivo**: `apps/backend/src/modules/purchases/purchases.service.spec.ts`
- **Línea**: 288
- **Test**: `aplica ordenamiento personalizado`
- **Error**:
  ```
  TS2345: Argument of type '{ sortBy: string; order: string; }' is not assignable to parameter of type 'PurchaseFiltersDto'.
  Types of property 'sortBy' are incompatible.
  Type 'string' is not assignable to type '"createdAt" | "total" | "purchaseDate" | "purchaseNumber" | undefined'.
  ```
- **Causa**: Inferencia de tipos incorrecta. Al crear el objeto `{ sortBy: 'total', order: 'ASC' }`, TypeScript infiere los tipos como `string` en lugar de los tipos literales específicos definidos en `PurchaseFiltersDto`.

**Código problemático:**
```typescript
const filters = { sortBy: 'total', order: 'ASC' };
await service.findAll(filters);
```

**Solución**: Usar `as const` o tipado explícito:
```typescript
// Opción 1: as const
const filters = { sortBy: 'total' as const, order: 'ASC' as const };

// Opción 2: Tipado explícito
import { PurchaseFiltersDto } from './dto/purchase-filters.dto';
const filters: PurchaseFiltersDto = { sortBy: 'total', order: 'ASC' };
```

### 2. Error de Memoria - Customer Accounts Service

- **Archivo**: `apps/backend/src/modules/customer-accounts/customer-accounts.service.spec.ts`
- **Error**: `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`
- **Causa**: El test suite de customer accounts consume demasiada memoria durante la ejecución, causando que el proceso de Jest sea terminado por el sistema operativo.

**Detalles:**
- El worker de Jest (PID=44664) fue terminado por falta de memoria
- El test suite tiene ~766 líneas con múltiples tests que crean mocks complejos
- Posible causa: Acumulación de objetos mock en memoria entre tests

**Solución**:
1. Limpiar mocks de manera más agresiva en `afterEach`
2. Considerar dividir el test suite en archivos más pequeños
3. Aumentar el límite de memoria de Node.js: `NODE_OPTIONS="--max-old-space-size=4096" npm test`

### 3. Test Suites que no se ejecutaron

Las siguientes test suites fallaron en ejecutarse debido al error de memoria anterior:

- **customer-accounts.service.spec.ts**: Falló por OOM
- **5 test suites adicionales**: Probablemente afectadas por el mismo problema de memoria del workspace

## Categorización de Fallos

| Categoría | Cantidad | Tests |
|-----------|----------|-------|
| **Tipado TypeScript** | 1 | `purchases.service.spec.ts` - ordenamiento personalizado |
| **Memoria/Performance** | 2+ | `customer-accounts.service.spec.ts` + suites afectadas |
| **Configuración** | 0 | - |
| **Lógica de Negocio** | 0 | - |

## Cobertura de Código (Coverage)

| Métrica | Actual | Requerido | Estado |
|---------|--------|-----------|--------|
| Statements | 18.13% | 70% | ❌ No cumple |
| Branches | 17.61% | 60% | ❌ No cumple |
| Lines | 17.70% | 70% | ❌ No cumple |
| Functions | 14.33% | 70% | ❌ No cumple |

**Nota**: La baja cobertura se debe principalmente a que muchos módulos no tienen tests implementados:
- Controladores (0% cobertura en su mayoría)
- Módulos como `backup`, `reports`, `configuration` sin tests
- Scripts de migración y seed sin cobertura

## Recomendaciones

### 1. Corregir Error de Tipos en Purchases
**Prioridad**: Alta
**Archivo**: `apps/backend/src/modules/purchases/purchases.service.spec.ts`

Usar tipado explícito o `as const` para los filtros:
```typescript
it('aplica ordenamiento personalizado', async () => {
    const filters: PurchaseFiltersDto = {
        sortBy: 'total',
        order: 'ASC'
    };
    await service.findAll(filters);
    expect(mockPurchaseRepo.createQueryBuilder().orderBy)
        .toHaveBeenCalledWith('purchase.total', 'ASC');
});
```

### 2. Resolver Problema de Memoria en Customer Accounts
**Prioridad**: Alta
**Archivo**: `apps/backend/src/modules/customer-accounts/customer-accounts.service.spec.ts`

Opciones:
1. **Limpiar mocks más agresivamente**:
```typescript
afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
});
```

2. **Dividir el suite** en archivos más pequeños por funcionalidad:
   - `customer-accounts.service.charges.spec.ts`
   - `customer-accounts.service.payments.spec.ts`
   - `customer-accounts.service.spec.ts` (operaciones básicas)

3. **Aumentar memoria de Node** para tests (solución temporal):
   Agregar a `package.json`:
   ```json
   "scripts": {
     "test": "NODE_OPTIONS='--max-old-space-size=4096' jest"
   }
   ```

### 3. Aumentar Cobertura de Tests
**Prioridad**: Media

Módulos prioritarios para agregar tests:
- **Controladores**: Actualmente tienen 0% cobertura
- **Módulos críticos sin tests**:
  - `backup.service.ts` - Funcionalidad de backups
  - `reports.service.ts` - Generación de reportes
  - `certificate-*.service.ts` - Certificados fiscales

### 4. Configurar Thresholds de Cobertura por Módulo
**Prioridad**: Baja

En lugar de un threshold global del 70%, configurar thresholds específicos por módulo en `jest.config.js`:

```javascript
coverageThreshold: {
  'src/modules/sales/': { statements: 80, branches: 70, lines: 80, functions: 75 },
  'src/modules/expenses/': { statements: 80, branches: 70, lines: 80, functions: 75 },
  'src/modules/customer-accounts/': { statements: 70, branches: 60, lines: 70, functions: 65 },
  // Otros módulos...
}
```

## Tests Pasados Destacados

Los siguientes test suites pasaron completamente:

- ✅ `sales.service.spec.ts` - 17/17 tests pasados
- ✅ `expenses.service.spec.ts` - 27/27 tests pasados
- ✅ `cash-register.service.spec.ts` - 25/25 tests pasados
- ✅ `incomes.service.spec.ts` - 25/25 tests pasados
- ✅ `auth.service.spec.ts` - Todos los tests pasados
- ✅ `suppliers.service.spec.ts` - Todos los tests pasados

## Próximos Pasos

1. **Inmediato**:
   - [ ] Corregir error de tipos en `purchases.service.spec.ts`
   - [ ] Resolver problema de memoria en `customer-accounts.service.spec.ts`

2. **Corto plazo**:
   - [ ] Re-ejecutar `npm run test:all` para verificar correcciones
   - [ ] Agregar tests para módulos críticos sin cobertura

3. **Largo plazo**:
   - [ ] Alcanzar 70% de cobertura global
   - [ ] Configurar CI/CD para ejecutar tests en cada PR
