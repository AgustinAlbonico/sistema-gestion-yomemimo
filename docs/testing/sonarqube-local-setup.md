# Guía de Configuración - SonarQube Local

Esta guía describe cómo configurar y usar SonarQube localmente para análisis de código y cobertura.

## Estado Actual

- **Docker Compose**: Configurado en `docker-compose.sonarqube.yml`
- **Contenedores**: Existen pero están detenidos
- **URL Local**: http://localhost:9000
- **Credenciales Default**: admin / admin

## Iniciar SonarQube Local

```bash
# Opción 1: Usar docker-compose (recomendado)
docker-compose -f docker-compose.sonarqube.yml up -d

# Opción 2: Si los contenedores ya existen
docker start sonarqube-db sonarqube
```

## Verificar Estado

```bash
# Ver contenedores
docker ps | grep sonar

# Ver logs
docker logs sonarqube -f
```

## Primer Acceso

1. Abrir http://localhost:9000
2. Ingresar con `admin` / `admin`
3. Cambiar contraseña cuando se solicite
4. Crear un token de autenticación:
   - Ir a: My Account > Security > Tokens
   - Generar token con nombre "local-analysis"
   - Guardar el token generado

## Configurar Sonar Scanner

El archivo `sonar-scanner.properties` ya está configurado para uso local:

```properties
sonar.host.url=http://localhost:9000
sonar.projectKey=sistema-gestion
```

Para escaneos con autenticación, exportar el token:

```bash
export SONAR_TOKEN=<tu-token-generado>
```

## Ejecutar Análisis

```bash
# Backend
cd apps/backend
npm run sonar:local

# Frontend (si tiene configuración)
cd apps/frontend
npm run sonar:scan

# Todo el proyecto (desde raíz)
npm run sonar:backend
```

## Solución de Problemas

### SonarQube no inicia

```bash
# Verificar memoria disponible
docker stats sonarqube

# Recrear contenedores
docker-compose -f docker-compose.sonarqube.yml down
docker-compose -f docker-compose.sonarqube.yml up -d
```

### Error de conexión

```bash
# Verificar que el puerto 9000 esté libre
netstat -an | grep 9000

# Ver logs del contenedor
docker logs sonarqube --tail 100
```

### Análisis falla

```bash
# Verificar que el token esté configurado
echo $SONAR_TOKEN

# Ejecutar con debug
sonar-scanner -X
```

## Métricas Objetivo

- **Cobertura de Código**: ≥ 80%
- **Duplicación de Código**: < 5%
- **Rating de Calidad**: B o mejor
- **Security Hotspots**: 0 críticos/alta prioridad

## Recursos

- [Documentación SonarQube](https://docs.sonarqube.org/latest/)
- [SonarScanner CLI](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/)
