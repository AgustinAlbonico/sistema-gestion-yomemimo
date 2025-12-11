# Utilidades de Fechas - Backend

Este archivo contiene funciones centralizadas para el manejo de fechas que previenen problemas de zona horaria.

## ⚠️ Problema que resuelve

Cuando recibes un string `'2024-11-28'` desde el frontend y usas `new Date('2024-11-28')`, JavaScript/TypeScript interpreta la fecha como **medianoche UTC**, lo que puede causar que se almacene con un día de diferencia en la base de datos.

## ✅ Solución

Todas las funciones en este archivo parsean fechas usando **zona horaria local**, garantizando que las fechas se almacenen correctamente.

## 📚 Funciones disponibles

### `parseLocalDate(dateString: string): Date`
**FUNCIÓN MÁS IMPORTANTE** - Parsea un string `YYYY-MM-DD` a `Date` usando zona horaria local.

```typescript
// ✅ CORRECTO - Usa esta función
const expenseDate = parseLocalDate(dto.expenseDate);

// ❌ INCORRECTO - Puede causar problemas de zona horaria
const expenseDate = new Date(dto.expenseDate);
```

### `formatDateLocal(date: Date): string`
Formatea un objeto `Date` a formato `YYYY-MM-DD` usando zona horaria local.

### `getTodayLocal(): string`
Obtiene la fecha de hoy en formato `YYYY-MM-DD` usando zona horaria local.

### `isValidDateString(dateString: string): boolean`
Valida si un string es una fecha válida en formato `YYYY-MM-DD`.

### `getMonthRange(date?: Date): { startDate: string; endDate: string }`
Obtiene el primer y último día del mes para una fecha dada.

## 📝 Reglas de uso

1. **SIEMPRE usa `parseLocalDate()` cuando recibas fechas del frontend**
   ```typescript
   // En DTOs que reciben fechas
   expenseDate: parseLocalDate(dto.expenseDate)
   ```

2. **NUNCA uses `new Date(dateString)` directamente con strings YYYY-MM-DD**
   ```typescript
   // ❌ INCORRECTO
   expenseDate: new Date(dto.expenseDate)
   
   // ✅ CORRECTO
   expenseDate: parseLocalDate(dto.expenseDate)
   ```

3. **Para fechas con hora/timestamp, parsea solo la parte de la fecha**
   ```typescript
   // La función parseLocalDate ya maneja esto automáticamente
   parseLocalDate('2024-11-28T10:00:00Z') // Solo toma "2024-11-28"
   ```

## 🔄 Ejemplo de uso en servicios

```typescript
import { parseLocalDate } from '../../common/utils/date.utils';

async create(dto: CreateExpenseDto) {
    const expense = this.expenseRepo.create({
        // ✅ Usar parseLocalDate para fechas
        expenseDate: parseLocalDate(dto.expenseDate),
        paidAt: dto.paidAt ? parseLocalDate(dto.paidAt) : null,
        // ... otros campos
    });
    
    return this.expenseRepo.save(expense);
}
```

## 🎯 Cuándo usar estas funciones

- ✅ Cuando recibes fechas desde DTOs (CreateDto, UpdateDto)
- ✅ Cuando necesitas parsear strings en formato `YYYY-MM-DD`
- ✅ Cuando trabajas con campos de tipo `date` en la base de datos

## ⚠️ Cuándo NO usar estas funciones

- ❌ Para timestamps completos (createdAt, updatedAt) - estos ya vienen correctos del ORM
- ❌ Para fechas que ya son objetos `Date` - úsalas directamente
- ❌ Para cálculos de tiempo/hora - usa Date nativo

