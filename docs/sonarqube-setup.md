# Configuración de SonarQube para Análisis de Código

Este documento describe la integración de SonarQube para análisis de código estático en el proyecto Sistema Gestión. Se utiliza una instancia local de SonarQube instalada en `C:\Herramientas\sonarqube-25.12.0.117093`.

## 🚀 Inicio Rápido

### 1. Iniciar SonarQube

```bash
# Usar el script para instancia local
./scripts/start-local-sonarqube.bat

# O manualmente desde el directorio de SonarQube
cd "C:\Herramientas\sonarqube-25.12.0.117093\bin\windows-x86-64"
StartSonar.bat
```

### 2. Acceder a SonarQube

- URL: http://localhost:9000
- Usuario: admin
- Contraseña: admin

### 3. Primer Inicio

1. Inicia sesión con las credenciales por defecto
2. Cambia la contraseña del administrador
3. Crea un nuevo proyecto "Sistema Gestión Backend"
4. Anota el token de proyecto (Project Authentication Token)

## 📋 Configuración

### Docker Compose

El archivo `docker-compose.sonarqube.yml` contiene:

- **SonarQube**: Servidor de análisis v9.9 (community)
- **PostgreSQL**: Base de datos v15 para SonarQube
- **Volúmenes**: Persistencia de datos
- **Red**: Red aislada para seguridad

### Configuración del Proyecto

#### Backend (`apps/backend/sonar-project.properties`)

```properties
# Metadata
sonar.projectKey=sistema-gestion-backend
sonar.projectName=Sistema Gestión Backend

# Paths
sonar.sources=src
sonar.tests=src
sonar.exclusions=src/**/*.spec.ts,src/test/**/*

# Coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### Scripts Disponibles

```bash
# Scripts de instancia local
./scripts/start-local-sonarqube.bat  # Iniciar SonarQube local
./scripts/stop-local-sonarqube.bat   # Detener SonarQube local

# Scripts npm (en apps/backend)
npm run sonar:scan              # Ejecutar análisis
npm run sonar:local            # Análisis local
npm run quality-check          # Lint + Tests + Sonar
```

## 🔧 CI/CD Integration

### GitHub Actions

El archivo `.github/workflows/sonarqube.yml` integra:

- Análisis automático en push/PR
- Reportes de cobertura
- Upload a Codecov

#### Variables Requeridas

En GitHub Settings > Secrets and variables:

```
SONAR_TOKEN=xxxxxxxxxxxxxxxxxxxx
```

### Pipeline de Calidad

```yaml
quality-check:
  - ESLint (estilo de código)
  - Jest (tests unitarios/integración)
  - SonarQube (análisis estático)
```

## 📊 Métricas de Calidad

### Reglas de Calidad (Quality Gates)

Estos son los umbrales recomendados para el proyecto:

#### Código
- **Cobertura mínima**: 80%
- **Bugs críticos**: 0
- **Vulnerabilidades**: 0
- **Code Smells**: < 10

#### Mantenibilidad
- **Complejidad ciclomática**: < 10
- **Duplicación de código**: < 3%
- **Tiempo técnico**: < 1 hora

### Perfiles de Calidad

Se han configurado perfiles para:

1. **NestJS/TypeScript**: Reglas específicas para el stack
2. **Seguridad**: Análisis de vulnerabilidades
3. **Cobertura**: Métricas de test coverage

## 🛠️ Análisis Local

### 1. Instalar SonarQube Scanner

```bash
# Descargar el scanner
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-windows.zip
# Descomprimir y agregar al PATH
```

### 2. Ejecutar Análisis

```bash
# Desde el root del proyecto
sonar-scanner

# O con npm
cd apps/backend
npm run sonar:scan
```

### 3. Ver Resultados

- Dashboard local: http://localhost:9000
- Reporte HTML: `reports/sonar-report.html`

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Docker no inicia

```bash
# Verificar estado de Docker
docker ps

# Ver logs de SonarQube
docker-compose -f docker-compose.sonarqube.yml logs -f sonarqube
```

#### 2. Análisis falla

```bash
# Verificar configuración
sonar-scanner -X

# Chequear exclusiones
grep -r "sonar.exclusions" ./
```

#### 3. Cobertura no detectada

```bash
# Asegurar que los tests generan reporte
cd apps/backend
npm run test:all

# Verificar archivo de cobertura
ls -la coverage/lcov.info
```

### Tips de Depuración

1. **Modo verbose**: `sonar-scanner -X`
2. **Logs detallados**: Revisar `docker-compose` logs
3. **Configuración**: Validar `sonar-project.properties`

## 🔐 Seguridad

### Buenas Prácticas

1. **Tokens**: Nunca commitear tokens en el código
2. **Acceso**: Limitar acceso al dashboard de SonarQube
3. **Actualizaciones**: Mantener SonarQube actualizado

### Permisos

- **Developers**: Ver resultados, crear issues
- **QA**: Configurar quality gates
- **Admin**: Gestionar usuarios y permisos

## 📈 Next Steps

### Mejoras Futuras

1. **Integración IDE**: Plugin de SonarQube en VS Code
2. **Reportes automáticos**: Email/slack alerts
3. **Docker local**: SonarQube en entorno local
4. **Multi-proyecto**: Configurar para frontend y monolith

### Monitoreo

- Métricas de cobertura en PRs
- Dashboard de calidad mensual
- Alertas para regresiones

## 📚 Referencias

- [SonarQube Documentation](https://docs.sonarqube.org/)
- [NestJS Best Practices](https://docs.nestjs.com/)
- [GitHub Actions](https://docs.github.com/actions)