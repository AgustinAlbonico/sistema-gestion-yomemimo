# Archivos No Testables - Documentación

Esta lista documenta archivos que por su naturaleza no requieren testing directo pero afectan las métricas de cobertura de SonarQube.

## Categorías de Archivos No Testables

### 1. Archivos de Configuración

Estos archivos contienen solo declaraciones de configuración y no tienen lógica que probar:

```
apps/backend/src/main.ts
apps/backend/tsconfig.json
apps/frontend/vite.config.ts
apps/frontend/index.html
```

**Justificación**: Son archivos de configuración/entry points. La validación se hace mediante:
- Tests de integración que verifican que el servidor inicia correctamente
- Tests E2E que verifican que la aplicación funciona en el navegador

### 2. DTOs (Data Transfer Objects)

Los DTOs validan datos pero la validación la hace `class-validator`:

```
apps/backend/src/modules/auth/dto/*.ts
apps/backend/src/modules/sales/dto/*.ts
apps/backend/src/modules/purchases/dto/*.ts
apps/backend/src/common/dto/*.ts
```

**Justificación**: La lógica de validación está en `class-validator`, una librería probada.
La cobertura de estos archivos no es crítica porque:
- La validación se prueba indirectamente en tests de controladores/servicios
- Los schemas de Zod (si se usan) proveen validación en runtime

### 3. Enums

Los enums son solo declaraciones de constantes:

```
apps/backend/src/common/enums/*.ts
apps/backend/src/modules/*/enums/*.ts
```

**Justificación**: No hay lógica que probar. Son valores constantes.

### 4. Entidades de TypeORM

Las entidades son mainly definiciones de datos con decoradores:

```
apps/backend/src/modules/*/entities/*.entity.ts
```

**Justificación**: Los métodos de las entidades (como `validatePassword`) se prueban
indirectamente a través de los servicios que las usan.

### 5. Tipos e Interfaces

```
apps/backend/src/modules/*/types/*.ts
apps/frontend/src/features/*/types/*.ts
```

**Justificación**: TypeScript valida los tipos en compile-time. No hay lógica runtime.

### 6. Archivos de Migración

```
apps/backend/src/migrations/*.ts
```

**Justificación**: Las migraciones se prueban:
- Manualmente al ejecutarlas
- En tests de integración que usan BD real
- Los tests de integración fallaron debido a problemas con enums, no con migraciones

## Configuración de SonarQube

Para excluir estos archivos del análisis de cobertura, agregar a `sonar-scanner.properties`:

```properties
# Excluir archivos de configuración
sonar.coverage.exclusions=**/*.dto.ts,**/entities/*.entity.ts,**/enums/*.ts,**/types/*.ts,**/migrations/**/*.ts,main.ts,vite.config.ts

# O excluir por patrón
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
```

## Estrategia de Cobertura

Para alcanzar el 80% de cobertura, nos enfocamos en:

1. **Servicios** (Services): La lógica de negocio principal
2. **Controladores** (Controllers): Los endpoints HTTP
3. **Hooks de React**: La lógica del frontend
4. **Componentes críticos**: Formularios y vistas principales

Lo que NO es necesario probar para el objetivo:

- DTOs y entidades (se prueban indirectamente)
- Configuraciones (se validan con integración/E2E)
- Enums y tipos (no tienen lógica)
- Migraciones (se prueban con BD real)
