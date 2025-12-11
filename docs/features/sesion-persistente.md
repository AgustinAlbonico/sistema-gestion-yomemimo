# Sesión Persistente - Sistema de Autenticación

## Descripción General

El sistema de autenticación ha sido actualizado para mantener la sesión del usuario activa indefinidamente hasta que cierre sesión manualmente. Esto se logra mediante:

1. **Tokens de larga duración**: Los tokens JWT ahora tienen una validez extendida
2. **Renovación automática**: El refresh token se renueva automáticamente antes de expirar

## Configuración de Tokens

### Backend

Los tiempos de expiración de los tokens han sido actualizados en los siguientes archivos:

#### `apps/backend/src/modules/auth/auth.service.ts`
- **Access Token**: 30 días (anteriormente 15 minutos)
- **Refresh Token**: 90 días (anteriormente 7 días)

#### `apps/backend/src/modules/auth/auth.module.ts`
- Valor por defecto de `JWT_EXPIRES_IN`: `'30d'`

#### `apps/backend/src/modules/auth/tokens.service.ts`
- Valor por defecto de `REFRESH_TOKEN_EXPIRES_IN`: `'90d'`

### Variables de Entorno (Opcional)

Puedes personalizar los tiempos de expiración mediante variables de entorno en el archivo `.env` del backend:

```env
JWT_EXPIRES_IN=30d
REFRESH_TOKEN_EXPIRES_IN=90d
```

## Renovación Automática del Refresh Token

### Frontend

Se ha implementado un hook personalizado que gestiona la renovación automática del refresh token:

#### `apps/frontend/src/hooks/useTokenRefresh.ts`

Este hook:
1. **Verifica periódicamente** (cada 24 horas) el estado del refresh token
2. **Decodifica el token** para obtener su fecha de expiración
3. **Renueva automáticamente** el token cuando faltan menos de 7 días para que expire
4. **Mantiene la sesión activa** sin intervención del usuario

#### Integración en `apps/frontend/src/App.tsx`

El hook se ejecuta automáticamente cuando la aplicación se carga y el usuario está autenticado.

## Flujo de Funcionamiento

### 1. Inicio de Sesión
```
Usuario ingresa credenciales
    ↓
Backend genera tokens:
  - Access Token: válido por 30 días
  - Refresh Token: válido por 90 días
    ↓
Frontend almacena tokens en localStorage
    ↓
Hook useTokenRefresh se activa
```

### 2. Durante la Sesión Activa
```
Cada 24 horas:
    ↓
Hook verifica expiración del refresh token
    ↓
¿Faltan menos de 7 días para expirar?
    ↓ SÍ
Renueva automáticamente el refresh token
    ↓
Nuevos tokens guardados en localStorage
    ↓
Sesión continúa activa
```

### 3. Cierre de Sesión
```
Usuario hace clic en "Cerrar Sesión"
    ↓
Frontend llama a authService.logout()
    ↓
Backend revoca todos los tokens del usuario
    ↓
Frontend limpia localStorage
    ↓
Usuario redirigido a /login
```

## Seguridad

### Consideraciones Implementadas

1. **Tokens en localStorage**: Los tokens se almacenan en localStorage del navegador
2. **Renovación automática**: Evita que el usuario pierda su sesión inesperadamente
3. **Revocación en cambio de contraseña**: Al cambiar la contraseña, todos los tokens se revocan
4. **Interceptor de axios**: Renueva automáticamente el access token cuando expira (401)

### Recomendaciones Adicionales

Para mejorar aún más la seguridad, considera implementar:

1. **Detección de actividad sospechosa**
   - Monitorear cambios de IP
   - Detectar múltiples sesiones simultáneas

2. **Límite de sesiones activas**
   - Permitir solo N sesiones activas por usuario
   - Revocar sesiones antiguas automáticamente

3. **Auditoría de sesiones**
   - Registrar todos los inicios de sesión (ya implementado en `LoginAudit`)
   - Permitir al usuario ver sus sesiones activas

4. **Tokens en cookies HttpOnly** (alternativa a localStorage)
   - Mayor seguridad contra ataques XSS
   - Requiere cambios en backend y frontend

## Ventajas del Sistema Actual

✅ **Experiencia de usuario mejorada**: No se cierra la sesión inesperadamente  
✅ **Mantenimiento automático**: El sistema renueva tokens sin intervención  
✅ **Control del usuario**: Solo se cierra sesión cuando el usuario lo decide  
✅ **Tokens de larga duración**: 30 días de access token, 90 días de refresh token  
✅ **Renovación proactiva**: Se renueva 7 días antes de expirar  

## Monitoreo y Debugging

### Logs en Consola

El hook `useTokenRefresh` registra en consola:
- Cuando renueva el refresh token automáticamente
- Errores durante la renovación

### Verificar Estado de Tokens

Puedes verificar el estado de los tokens en las DevTools del navegador:

```javascript
// En la consola del navegador
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
```

### Decodificar Tokens

Para ver el contenido de un token JWT:

```javascript
// En la consola del navegador
import { jwtDecode } from 'jwt-decode';
const token = localStorage.getItem('refreshToken');
console.log(jwtDecode(token));
```

## Troubleshooting

### El usuario sigue siendo deslogueado

1. Verificar que `jwt-decode` esté instalado: `pnpm list jwt-decode`
2. Revisar logs en consola del navegador
3. Verificar que el hook `useTokenRefresh` se esté ejecutando
4. Comprobar que las variables de entorno estén configuradas correctamente

### Error al renovar tokens

1. Verificar conectividad con el backend
2. Revisar logs del backend
3. Comprobar que el refresh token no haya sido revocado manualmente
4. Verificar que el usuario siga activo en la base de datos

## Archivos Modificados

### Backend
- `apps/backend/src/modules/auth/auth.service.ts`
- `apps/backend/src/modules/auth/auth.module.ts`
- `apps/backend/src/modules/auth/tokens.service.ts`

### Frontend
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/hooks/useTokenRefresh.ts` (nuevo)
- `apps/frontend/package.json` (agregado `jwt-decode`)

## Conclusión

El sistema de sesión persistente ahora permite que los usuarios mantengan su sesión activa sin interrupciones, mejorando significativamente la experiencia de usuario mientras mantiene un nivel adecuado de seguridad mediante la renovación automática de tokens.
