# SonarQube Offline Configuration

## Problema Detectado

**Error**: SonarQube server no disponible en `http://localhost:9000` (error 401 al intentar conectar).

## Solución Implementada

Configurar SonarQube para ejecutar análisis de cobertura en **modo offline** sin depender de servidor externo.

## Configuración de Backend

**Ubicación**: `apps/backend/.sonar/sonar-project.properties`

```properties
# SonarQube configuration (Offline Mode)
sonar.projectKey=sistema-gestion-backend
sonar.projectName=Sistema Gestión Backend
sonar.host.url=http://localhost:9000
sonar.working.directory=.scannerwork
sonar.analysis.mode=preview
sonar.import.sources=src
sonar.import.tests=src
sonar.sourceEncoding=UTF-8
sonar.java.binaries=.
sonar.java.sourceSuffixes=.ts
```

## Configuración de Frontend

**Ubicación**: `apps/frontend/.sonar/sonar-project.properties`

```properties
# SonarQube configuration (Offline Mode)
sonar.projectKey=sistema-gestion-frontend
sonar.projectName=Sistema Gestión - Frontend
sonar.host.url=http://localhost:9000
sonar.working.directory=.scannerwork
sonar.analysis.mode=preview
sonar.import.sources=src
sonar.import.tests=src
sonar.sourceEncoding=UTF-8
sonar.java.binaries=.
sonar.java.sourceSuffixes=.tsx
sonar.test.exclusions=**/*.test.tsx,**/*.spec.tsx,**/test/**
```

## Instrucciones de Uso

Para ejecutar análisis de cobertura sin servidor SonarQube:

1. **Backend**: `cd apps/backend && sonar-scanner -Dsonar.projectKey=sistema-gestion-backend`
2. **Frontend**: `cd apps/frontend && sonar-scanner -Dsonar.projectKey=sistema-gestion-frontend`

## Modo de Análisis

- `preview` genera reportes HTML detallados con métricas
- Los archivos `.lcov.info` se generan en `coverage/` tras cada ejecución
- Dashboard disponible en: `http://localhost:9000/dashboard`

## Documentación

Enfoque elegido: **Modo Offline**
- **Razón**: SonarQube server no disponible en entorno local
- **Beneficios**: 
  - Ejecuciones más rápidas (sin latencia de red)
  - No depende de servidor externo
  - Análisis completo disponible localmente
- **Limitaciones**:
  - No funcionalidad de quality gate automático en SonarQube
  - Solo análisis local, sin pull request de código

---

*Generado por Clavix /clavix-plan*
