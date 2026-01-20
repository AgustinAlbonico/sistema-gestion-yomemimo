# Guía de Backup y Restauración de Base de Datos

Esta guía explica cómo realizar copias de seguridad y restaurar la base de datos PostgreSQL del sistema.

## Configuración

| Parámetro | Valor |
|-----------|-------|
| Motor | PostgreSQL |
| Host | `localhost` |
| Puerto | `5432` |
| Usuario | `postgres` |
| Password | *(tu contraseña de .env)* |
| Base de datos | `nexopos` |

---

## Crear Backup

### Opción 1: Usando pg_dump (recomendado)

```bash
# Backup completo de la base de datos
pg_dump -h localhost -p 5432 -U postgres -F c -b -v -f "backup-$(date +%Y%m%d-%H%M%S).dump" nexopos

# Te pedirá tu contraseña de PostgreSQL
```

**Explicación de flags:**
| Flag | Descripción |
|------|-------------|
| `-h` | Host del servidor |
| `-p` | Puerto |
| `-U` | Usuario |
| `-F c` | Formato custom (compresión incluida) |
| `-b` | Incluye blobs grandes |
| `-v` | Modo verbose |
| `-f` | Archivo de salida |

### Opción 2: Backup como SQL (texto plano)

```bash
pg_dump -h localhost -p 5432 -U postgres -F p -f "backup-$(date +%Y%m%d-%H%M%S).sql" nexopos
```

### Opción 3: Backup con contraseña inline

```bash
set PGPASSWORD=tu_contraseña
pg_dump -h localhost -p 5432 -U postgres -F c -b -v -f "backup.dump" nexopos
```

---

## Restaurar Backup

### Opción 1: Desde archivo .dump (formato custom)

```bash
pg_restore -h localhost -p 5432 -U postgres -d nexopos -v "backup-archivo.dump"
```

### Opción 2: Desde archivo .sql (texto plano)

```bash
psql -h localhost -p 5432 -U postgres -d nexopos < backup-archivo.sql
```

### Opción 3: Restauración limpia (elimina datos existentes)

```bash
pg_restore --clean -h localhost -p 5432 -U postgres -d nexopos -v "backup-archivo.dump"
```

---

## Script de Backup Automatizado (Windows)

Crea un archivo `backup-db.bat`:

```batch
@echo off
setlocal

REM Configuración
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_NAME=nexopos
set PGPASSWORD=tu_contraseña

REM Directorio de backups
set BACKUP_DIR=backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Nombre del archivo con fecha
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.dump

REM Crear backup
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F c -b -v -f "%BACKUP_FILE%" %DB_NAME%

echo Backup creado: %BACKUP_FILE%
pause
```

**Uso:** Doble clic sobre `backup-db.bat`

---

## Script de Backup Automatizado (Linux/Mac)

Crea un archivo `backup-db.sh`:

```bash
#!/bin/bash

# Configuración
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="nexopos"
BACKUP_DIR="./backups"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con fecha
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).dump"

# Crear backup
PGPASSWORD="tu_contraseña" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v -f "$BACKUP_FILE" "$DB_NAME"

echo "Backup creado: $BACKUP_FILE"
```

**Uso:**
```bash
chmod +x backup-db.sh
./backup-db.sh
```

---

## Buenas Prácticas

| Práctica | Descripción |
|----------|-------------|
| **Frecuencia** | Realiza backups diarios si hay actividad constante |
| **Retención** | Mantén al menos 7 días de backups |
| **Testing** | Prueba restaurar un backup mensualmente |
| **Almacenamiento** | Guarda backups en otra ubicación física |
| **Nomenclatura** | Usa fechas en el nombre del archivo |

---

## Solución de Problemas

### Error: "connection refused"
Verifica que PostgreSQL esté corriendo en el puerto 5432:
```bash
# Windows
netstat -an | findstr 5432

# Linux/Mac
netstat -tuln | grep 5432
```

### Error: "password authentication failed"
Verifica tu contraseña de PostgreSQL. Por defecto en instalaciones locales puede ser la misma que tu usuario de Windows, o la que configuraste al instalar PostgreSQL.

### Error: "database does not exist"
Primero crea la base de datos:
```bash
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE nexopos;"
```

### Error restaurando: "database already exists"
Usa `--clean` para eliminar objetos existentes antes de restaurar:
```bash
pg_restore --clean -h localhost -p 5432 -U postgres -d nexopos -v backup.dump
```
