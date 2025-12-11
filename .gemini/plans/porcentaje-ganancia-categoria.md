# Plan de Implementación: Porcentaje de Ganancia por Categoría

## Objetivo
Agregar la posibilidad de definir un porcentaje de ganancia por categoría de producto. La jerarquía de prioridad sería:

1. **Porcentaje personalizado del producto** (máxima prioridad) - `useCustomMargin = true`
2. **Porcentaje de la categoría** (prioridad media) - cuando la categoría tiene `profitMargin` definido
3. **Porcentaje general de configuración** (prioridad menor) - `defaultProfitMargin` del sistema

## Reglas de Negocio

1. Si un producto tiene `useCustomMargin = true`, usa su propio margen (sin importar la categoría)
2. Si un producto tiene una categoría con `profitMargin` definido Y el producto NO tiene margen personalizado, usa el margen de la categoría
3. Si un producto NO tiene margen personalizado Y su categoría NO tiene margen definido, usa el `defaultProfitMargin` del sistema
4. Si un producto tiene múltiples categorías con márgenes diferentes, se debe usar el mayor de ellos (o el primero definido)
5. Cuando se actualiza el margen de una categoría, se deben recalcular los precios de los productos afectados

---

## Fase 1: Backend - Modificar Entidad Category

### 1.1 Actualizar `category.entity.ts`
- Agregar columna `profitMargin` (decimal, nullable)

```typescript
@Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
        to: (value: number) => value,
        from: (value: string) => value ? parseFloat(value) : null,
    },
})
profitMargin?: number | null;
```

### 1.2 Crear migración de base de datos
- Agregar columna `profit_margin` a tabla `categories`

---

## Fase 2: Backend - Actualizar DTOs

### 2.1 Actualizar `create-category.dto.ts`
- Agregar campo `profitMargin` (opcional, número, min 0, max 1000)

### 2.2 Actualizar `update-category.dto.ts`
- Heredar el nuevo campo de CreateCategoryDTO

---

## Fase 3: Backend - Modificar Servicios

### 3.1 Actualizar `categories.service.ts`
- Agregar método `recalculateProductPrices(categoryId)` que recalcula precios de productos cuando se actualiza el margen de la categoría
- Modificar método `update()` para llamar a `recalculateProductPrices()` cuando cambia el margen

### 3.2 Actualizar `products.service.ts`
- Modificar lógica de `create()` para considerar el margen de categoría
- Modificar lógica de `update()` para considerar el margen de categoría cuando cambian las categorías
- Crear método auxiliar `getEffectiveProfitMargin(product)` que retorna el margen efectivo según la jerarquía

### 3.3 Actualizar `configuration.service.ts`
- Modificar `updateAllProductsPrices()` para:
  - Excluir productos con `useCustomMargin = true` (ya lo hace)
  - Excluir productos cuyas categorías tengan `profitMargin` definido
  - Solo actualizar productos que realmente usen el margen general

---

## Fase 4: Frontend - Actualizar Tipos

### 4.1 Actualizar `types/index.ts`
- Agregar `profitMargin?: number` a interface `Category`
- Actualizar `CreateCategoryDTO` y `UpdateCategoryDTO`

---

## Fase 5: Frontend - Actualizar UI de Categorías

### 5.1 Modificar diálogo de categorías en `ProductsPage.tsx`
- Agregar campo para ingresar % de ganancia al crear categoría
- Mostrar el % de ganancia en cada badge de categoría
- Permitir editar categorías (actualmente solo se pueden crear/eliminar)

### 5.2 Crear componente `CategoryFormDialog.tsx` (opcional)
- Formulario completo para crear/editar categorías
- Campos: nombre, descripción, color, porcentaje de ganancia, estado activo

---

## Fase 6: Frontend - Actualizar ProductForm

### 6.1 Modificar `ProductForm.tsx`
- Cuando se selecciona una categoría con margen definido, mostrar info del margen heredado
- El precio calculado debe reflejar la jerarquía de márgenes
- Agregar tooltip/indicador de origen del margen (general/categoría/personalizado)

---

## Estimación de Archivos a Modificar

### Backend:
1. `apps/backend/src/modules/products/entities/category.entity.ts`
2. `apps/backend/src/modules/products/dto/create-category.dto.ts`
3. `apps/backend/src/modules/products/dto/update-category.dto.ts`
4. `apps/backend/src/modules/products/categories.service.ts`
5. `apps/backend/src/modules/products/products.service.ts`
6. `apps/backend/src/modules/configuration/configuration.service.ts`

### Frontend:
1. `apps/frontend/src/features/products/types/index.ts`
2. `apps/frontend/src/pages/products/ProductsPage.tsx`
3. `apps/frontend/src/features/products/components/ProductForm.tsx`

---

## Notas de Implementación

- La relación producto-categoría es ManyToMany, un producto puede tener múltiples categorías
- Si un producto tiene múltiples categorías con márgenes, se usará el MAYOR de ellos
- La actualización de precios al modificar el margen de categoría debe ser una operación batch eficiente
