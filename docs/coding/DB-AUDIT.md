# Auditoría de Base de Datos PostgreSQL - NexoPOS

## Resumen Ejecutivo

### Estado General
- **Cumplimiento 3FN**: **MEDIO** - El esquema tiene buen diseño general pero presenta algunas violaciones de normalización aceptables por performance.
- **Tablas**: 31 + brands (32 total con migraciones recientes)
- **Enums**: 16 tipos enumerados
- **Foreign Keys**: 36 constraints
- **Índices**: 48 índices

### Top 5 Problemas Críticos

| # | Problema | Tabla(s) | Impacto |
|---|----------|----------|---------|
| 1 | **Datos desnormalizados del emisor** | `invoices` | Duplica 12 campos de `fiscal_configuration` en cada factura |
| 2 | **Columna duplicada FK** | `refresh_tokens`, `stock_movements` | `userId` y `user_id` duplicados; `productId` y `product_id` |
| 3 | **customerName desnormalizado** | `sales`, `incomes` | Nombre del cliente duplicado (debería venir de FK) |
| 4 | **providerName desnormalizado** | `purchases` | Nombre proveedor duplicado (ya existe FK a `suppliers`) |
| 5 | **Timestamps sin timezone** | Todas | Usar `timestamptz` en lugar de `timestamp without time zone` |

### Top 5 Mejoras de Performance por Impacto

| # | Mejora | Tabla(s) | Impacto |
|---|--------|----------|---------|
| 1 | Índice en `invoices.status` | invoices | Alto - Consultas de facturas pendientes |
| 2 | Índice en `sale_items.sale_id` | sale_items | Alto - JOINs frecuentes |
| 3 | Índice en `purchase_items.purchase_id` | purchase_items | Medio - JOINs frecuentes |
| 4 | Índice en `cash_movements.cash_register_id` | cash_movements | Medio - Reportes de caja |
| 5 | Índice en `account_movements.accountId` ya existe ✓ | - | Ya implementado |

---

## Hallazgos Detallados

### 1. Violaciones de 3FN

| Tabla | Problema | Evidencia | Riesgo | Refactor Propuesto |
|-------|----------|-----------|--------|-------------------|
| `invoices` | Campos del emisor duplicados | `emitterCuit`, `emitterBusinessName`, `emitterAddress`, etc. son copia de `fiscal_configuration` | **Bajo** - Es correcto para facturas fiscales (snapshot inmutable) | ✅ Mantener - Justificado por regulaciones fiscales AFIP |
| `sales` | `customerName` duplicado | También existe `customer_id` FK | **Medio** - Inconsistencia si cambia nombre del cliente | Considerar eliminar y calcular via JOIN, o mantener como snapshot |
| `incomes` | `customerName` duplicado | También existe `customer_id` FK | **Medio** | Mismo tratamiento que `sales` |
| `purchases` | `providerName`, `providerDocument`, `providerPhone` | Existe `supplier_id` FK | **Medio** | Considerar eliminar y usar `suppliers` via JOIN |
| `sale_items` | `productDescription`, `productCode` | Ya existe `product_id` FK | **Bajo** - Snapshot correcto para ventas históricas | ✅ Mantener - Preserva precio/descripción al momento de venta |
| `refresh_tokens` | `userId` y `user_id` duplicadas | Ambas columnas en la tabla | **Alto** - Redundancia innecesaria | Eliminar una de las dos columnas |
| `stock_movements` | `productId` y `product_id` duplicadas | Ambas columnas en la tabla | **Alto** - Redundancia innecesaria | Eliminar una de las dos columnas |

### 2. Redundancias / Solapamientos

| Elemento | Descripción | Recomendación |
|----------|-------------|---------------|
| `categories` vs `customer_categories` vs `expense_categories` vs `income_categories` | 4 tablas de categorías separadas | ✅ **Correcto** - Son dominios diferentes, no consolidar |
| Enums `ivacondition` | Duplicado en `customers`, `suppliers`, `fiscal_configuration` | ✅ **Correcto** - Diferentes contextos de uso |
| Enums `documenttype` | Duplicado en `customers` y `suppliers` | Considerar unificar en un solo enum compartido |

### 3. Campos Sospechosos / No Útiles

| Tabla | Campo | Observación | Decisión |
|-------|-------|-------------|----------|
| `fiscal_configuration` | Certificados en `text` | 12 campos de certificados AFIP | ✅ Mantener - Necesarios para facturación electrónica |
| `products` | `sku` | Puede estar vacío en muchos registros | ✅ Mantener - Útil para productos con SKU |
| `products` | `barcode` | Solo si se usa lector | ✅ Mantener - Feature importante |
| `incomes` | `isOnAccount` | Parece duplicar lógica de cuentas corrientes | Revisar uso - Posible eliminar |
| `sales` | `isFiscal`, `fiscalPending`, `fiscalError` | Campos de estado fiscal | ✅ Mantener - Workflow de facturación |
| `tax_types` | Tabla completa | No parece tener FKs apuntando a ella | Revisar si está en uso; posible eliminar |

---

## Plan de Acción Priorizado

### Alta Prioridad / Bajo Esfuerzo

#### 1. Agregar índices faltantes
```sql
-- invoices.status (consultas de facturas pendientes)
CREATE INDEX IF NOT EXISTS "IDX_invoices_status" ON "invoices" ("status");

-- sale_items.sale_id (ya tiene FK pero verificar índice)
CREATE INDEX IF NOT EXISTS "IDX_sale_items_sale_id" ON "sale_items" ("sale_id");

-- purchase_items.purchase_id
CREATE INDEX IF NOT EXISTS "IDX_purchase_items_purchase_id" ON "purchase_items" ("purchase_id");

-- cash_movements.cash_register_id
CREATE INDEX IF NOT EXISTS "IDX_cash_movements_cash_register_id" ON "cash_movements" ("cash_register_id");

-- incomes.category_id
CREATE INDEX IF NOT EXISTS "IDX_incomes_category_id" ON "incomes" ("category_id");

-- expenses.category_id
CREATE INDEX IF NOT EXISTS "IDX_expenses_category_id" ON "expenses" ("category_id");
```

#### 2. Corregir columnas duplicadas en refresh_tokens
```sql
-- Verificar cual tiene datos y eliminar la vacía
-- Si ambas tienen datos, migrar a una sola
ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "user_id";
-- O si user_id es la correcta:
-- ALTER TABLE "refresh_tokens" DROP COLUMN "userId";
```

#### 3. Corregir columnas duplicadas en stock_movements
```sql
-- Verificar cual tiene datos
ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "product_id";
-- O si product_id es la correcta:
-- ALTER TABLE "stock_movements" DROP COLUMN "productId";
```

### Media Prioridad / Medio Esfuerzo

#### 4. Cambiar timestamps a timestamptz (migración larga)
```sql
-- Para cada tabla con timestamps
ALTER TABLE "sales" 
  ALTER COLUMN "createdAt" TYPE timestamptz,
  ALTER COLUMN "updatedAt" TYPE timestamptz,
  ALTER COLUMN "deletedAt" TYPE timestamptz;
-- Repetir para las demás tablas
```

> **Riesgo**: Bajo. La conversión es automática.
> **Cómo validar**: Comparar counts antes/después.

#### 5. Revisar tabla tax_types
```sql
-- Verificar si está en uso
SELECT * FROM "tax_types";
-- Si está vacía o no tiene referencias, considerar eliminar
```

### Baja Prioridad / Alto Esfuerzo

#### 6. Unificar enums documenttype
Requiere:
1. Crear enum unificado
2. Migrar datos de customers y suppliers
3. Eliminar enums viejos

> **Impacto**: Bajo - No afecta performance
> **Decisión**: Postergar

---

## Notas sobre Desnormalizaciones Justificadas

### ✅ Mantener (Justificado)

1. **`invoices.emitter*`**: Los datos del emisor en facturas deben ser inmutables por regulación fiscal. Si la empresa cambia de dirección, las facturas antiguas deben conservar la dirección original.

2. **`sale_items.productDescription`, `productCode`, `unitPrice`**: Snapshot del momento de la venta. Correcto para preservar el historial exacto de lo que se vendió y a qué precio.

3. **`sales.customerName`, `incomes.customerName`**: Podría ser útil para ventas a "consumidor final" sin cliente registrado. **Revisar** si ambos campos (`customer_id` y `customerName`) se usan mutuamente excluyentes o en conjunto.

4. **`purchases.providerName`**: Similar razonamiento para compras a proveedores no registrados.

---

## Métricas del Esquema

| Métrica | Valor | Evaluación |
|---------|-------|------------|
| Tablas con PK UUID | 31/31 | ✅ Excelente |
| Tablas con soft-delete | 12/31 | ✅ Bien implementado |
| FKs con ON DELETE CASCADE | 8/36 | ⚠️ Revisar orphans posibles |
| Índices por tabla (promedio) | 1.5 | ⚠️ Bajo en algunas tablas |
| Columnas nullable sin default | ~40 | ✅ Aceptable |

---

## Próximos Pasos Recomendados

1. **Inmediato**: Ejecutar script de índices faltantes
2. **Corto plazo**: Resolver columnas duplicadas en `refresh_tokens` y `stock_movements`
3. **Mediano plazo**: Migrar timestamps a `timestamptz`
4. **Largo plazo**: Revisar y limpiar campos no usados con métricas de uso real
