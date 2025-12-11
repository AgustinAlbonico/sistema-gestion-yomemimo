---
description: Implementar sesión persistente que no expire automáticamente
---

# Plan de Implementación: Sesión Persistente

## Objetivo
Hacer que la sesión del usuario permanezca activa indefinidamente hasta que cierre sesión manualmente.

## Cambios Necesarios

### 1. Backend - Aumentar tiempo de expiración de tokens

**Archivo**: `apps/backend/src/modules/auth/auth.service.ts`
- Cambiar `JWT_EXPIRES_IN` de `'15m'` a `'30d'` (30 días)
- Cambiar `REFRESH_TOKEN_EXPIRES_IN` de `'7d'` a `'90d'` (90 días)

**Archivo**: `apps/backend/src/modules/auth/auth.module.ts`
- Actualizar el valor por defecto de `expiresIn` a `'30d'`

### 2. Frontend - Implementar renovación automática del refresh token

**Archivo**: `apps/frontend/src/lib/axios.ts`
- Modificar el interceptor de respuesta para renovar el refresh token cuando esté próximo a expirar
- Agregar lógica para verificar la expiración del refresh token periódicamente

**Nuevo archivo**: `apps/frontend/src/hooks/useTokenRefresh.ts`
- Crear un hook que verifique periódicamente si el refresh token está próximo a expirar
- Si está próximo a expirar (por ejemplo, faltan menos de 7 días), renovarlo automáticamente

### 3. Integrar el hook en la aplicación

**Archivo**: `apps/frontend/src/App.tsx`
- Integrar el hook `useTokenRefresh` para que se ejecute cuando el usuario esté autenticado

## Consideraciones de Seguridad

1. Los tokens de larga duración pueden ser un riesgo de seguridad si son comprometidos
2. Se recomienda implementar:
   - Detección de actividad sospechosa
   - Revocación de tokens en caso de cambio de contraseña
   - Límite de sesiones activas por usuario

## Valores Recomendados

- **Access Token**: 30 días (suficiente para uso normal)
- **Refresh Token**: 90 días (se renovará automáticamente antes de expirar)
- **Renovación automática**: Cuando falten 7 días para expirar el refresh token
