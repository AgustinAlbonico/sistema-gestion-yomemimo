---
id: comp-20250118-analisis-tests-fallidos
depthUsed: comprehensive
timestamp: 2025-01-18T12:00:00Z
executed: true
originalPrompt: "Corre de vuelta los tests. Dame un resumen de los que no pasaron y por que"
---

# Improved Prompt

## Objetivo
Re-ejecutar la suite completa de tests E2E y generar un resumen detallado de los tests que fallaron.

## Contexto
Los tests se ejecutaron previamente con estos resultados:
- 72 passed
- 53 failed
- 18 skipped

Se aplicaron refactorizaciones para corregir patrones `.or()` en Playwright que causaban errores de sintaxis.

## Acciones Solicitadas

### 1. Ejecutar tests E2E completos
```bash
cd apps/frontend && npm run test:e2e
```

### 2. Analizar únicamente los tests que FALLARON
Para cada test fallido, documentar:
- **Archivo y línea** donde falla
- **Nombre del test**
- **Mensaje de error** exacto
- **Causa raíz** (error de código, dato faltante, elemento UI no encontrado, etc.)

### 3. Agrupar fallos por categoría
- ❌ Errores de código/sintaxis (requieren fix)
- ⚠️ Datos faltantes (requieren setup de datos de prueba)
- 🔄 Elementos UI no encontrados (requieren investigación de UI)

### 4. Generar resumen ejecutivo
- Total de tests por categoría
- Tests críticos que bloquean funcionalidad principal
- Tests no críticos que pueden documentarse como deuda técnica

## Formato de Salida Esperado

```markdown
## Resumen de Tests Fallidos (X total)

### Críticos - Requieren Fix Inmediato
| Test | Error | Causa |
|------|-------|-------|

### Datos Faltantes - Requieren Setup
| Test | Dato Requerido |
|------|----------------|

### UI/Selector Issues - Requieren Investigación
| Test | Elemento No Encontrado |
|------|------------------------|
```

## Criterio de Éxito
Cuando tengas un listado completo de todos los tests fallidos con sus causas agrupadas por categoría.

---

## Quality Scores
- **Clarity**: 85%
- **Efficiency**: 90%
- **Structure**: 85%
- **Completeness**: 90%
- **Actionability**: 95%
- **Specificity**: 85%
- **Overall**: 88% (good)

## Original Prompt
```
Corre de vuelta los tests. Dame un resumen de los que no pasaron y por que
```

## Alternative Approaches

### Opción 1: Enfoque en Tests Críticos
"Ejecuta tests E2E y lista SOLO los tests críticos que fallan (ventas, caja, auth). Ignora tests no críticos."

### Opción 2: Enfoque en Fix vs Deuda
"Ejecuta tests E2E y separa fallos en dos grupos: (1) errores que debo arreglar yo, (2) problemas de configuración/datos que se pueden documentar."

## Validation Checklist

- [ ] Suite de tests E2E ejecutada completamente
- [ ] Todos los tests fallidos identificados con nombre exacto
- [ ] Cada test fallido tiene causa raíz documentada
- [ ] Fallos agrupados por categoría (código/datos/UI)
- [ ] Resumen ejecutivo generado con totales

## Edge Cases to Consider

- Tests que fallan intermitentemente (flaky tests)
- Tests que se marcan como "skipped" pero en realidad fallaron
- Timeout errors vs assertion errors
- Tests que fallan por dependencias externas (API, base de datos)

## What Could Go Wrong

- La suite de tests tarda mucho (>10 minutos) - considerar ejecutar solo archivos específicos
- Demasiados errores para analizar en una sola respuesta - agrupar por patrón
- Error al ejecutar npm run test:e2e por configuración - verificar ambiente
- Output truncado por límites de tokens - priorizar errores más comunes
