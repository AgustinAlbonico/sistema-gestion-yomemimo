# Utilidades de Fechas - Frontend

Este archivo contiene funciones centralizadas para el manejo de fechas que previenen problemas de zona horaria.

## ⚠️ Problema que resuelve

Cuando usas `new Date('2024-11-28')`, JavaScript interpreta la fecha como **medianoche UTC**, lo que puede causar que se muestre un día anterior en zonas horarias detrás de UTC (como Argentina UTC-3).

## ✅ Solución

Todas las funciones en este archivo usan **zona horaria local**, garantizando que las fechas se manejen correctamente independientemente de la zona horaria del servidor o cliente.

## 📚 Funciones disponibles

### `getTodayLocal(): string`
Obtiene la fecha de hoy en formato `YYYY-MM-DD` usando zona horaria local.

```typescript
const today = getTodayLocal(); // "2024-11-28"
```

### `formatDateLocal(date: Date): string`
Formatea un objeto `Date` a formato `YYYY-MM-DD` usando zona horaria local.

```typescript
const date = new Date(2024, 10, 28); // 28 de noviembre
const formatted = formatDateLocal(date); // "2024-11-28"
```

### `parseLocalDate(dateString: string): Date`
Parsea un string `YYYY-MM-DD` a `Date` usando zona horaria local. **Esta es la función más importante** para evitar problemas de zona horaria.

```typescript
// ✅ CORRECTO - Usa esta función
const date = parseLocalDate('2024-11-28');

// ❌ INCORRECTO - Puede causar problemas de zona horaria
const date = new Date('2024-11-28');
```

### `getCurrentMonthRange(): { startDate: string; endDate: string }`
Obtiene el primer y último día del mes actual.

```typescript
const range = getCurrentMonthRange();
// { startDate: "2024-11-01", endDate: "2024-11-30" }
```

### `getCurrentWeekRange(): { startDate: string; endDate: string }`
Obtiene el primer y último día de la semana actual (domingo a sábado).

### `getTodayRange(): { startDate: string; endDate: string }`
Obtiene el rango de hoy (misma fecha para inicio y fin).

### `formatDateForDisplay(dateString: string, format?: 'short' | 'long'): string`
Formatea una fecha para mostrar en la UI.

```typescript
formatDateForDisplay('2024-11-28', 'short'); // "28/11/2024"
formatDateForDisplay('2024-11-28', 'long'); // "28 de noviembre, 2024"
```

### `isValidDateString(dateString: string): boolean`
Valida si un string es una fecha válida en formato `YYYY-MM-DD`.

## 📝 Reglas de uso

1. **NUNCA uses `new Date('YYYY-MM-DD')` directamente**
   - ✅ Usa `parseLocalDate('YYYY-MM-DD')` en su lugar

2. **NUNCA uses `date.toISOString().split('T')[0]` para obtener la fecha de hoy**
   - ✅ Usa `getTodayLocal()` en su lugar

3. **Para formatear fechas para mostrar:**
   - ✅ Usa `formatDateForDisplay(dateString, 'short' | 'long')`

4. **Para rangos de fechas:**
   - ✅ Usa `getCurrentMonthRange()`, `getCurrentWeekRange()`, `getTodayRange()`

## 🔄 Migración

Si encuentras código que usa fechas de forma incorrecta, reemplázalo:

```typescript
// ❌ Antes
const today = new Date().toISOString().split('T')[0];
const date = new Date('2024-11-28');

// ✅ Después
import { getTodayLocal, parseLocalDate } from '@/lib/date-utils';
const today = getTodayLocal();
const date = parseLocalDate('2024-11-28');
```

