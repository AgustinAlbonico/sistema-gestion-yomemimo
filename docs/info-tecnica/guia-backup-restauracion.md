# Guía de Backup y Restauración de Base de Datos

Esta guía explica cómo realizar copias de seguridad y restaurar la base de datos PostgreSQL del sistema.

## Configuración

| Parámetro | Valor |
|-----------|-------|
| Motor | PostgreSQL |
| Host | `localhost` |
| Puerto | `5432` |
| Usuario | `postgres` |
| Password | *(ver .env en raíz del proyecto)* |
| Base de datos | `nexopos` |

---

## Crear Backup

### Desde el sistema web

El sistema tiene un botón para crear backups automáticamente. Los archivos se guardan en:
- **Ruta**: `C:\Users\agust\Desktop\backups\`
- **Formato**: `.backup` (PostgreSQL custom comprimido)
- **Nombre**: `backup_YYYY-MM-DDTHH-MM-SS.backup`

### Opción manual: pg_dump

```bash
pg_dump -h localhost -p 5432 -U postgres -F c -b -v -f "backup-$(date +%Y%m%d-%H%M%S).backup" nexopos
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

---

## Restaurar Backup

### ⚠️ Método recomendado: Eliminar y recrear base de datos

Debido a dependencias circulares entre tablas (users, products, stock_movements, etc.), el método más confiable es eliminar y recrear la base de datos desde cero:

```bash
# Un solo comando - elimina, crea y restaura
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS nexopos; CREATE DATABASE nexopos;" && pg_restore -h localhost -p 5432 -U postgres -d nexopos -v "C:\ruta\backup_archivo.backup"
```

**O paso a paso:**

```bash
# 1. Eliminar base de datos existente
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS nexopos;"

# 2. Crear base de datos vacía
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE nexopos;"

# 3. Restaurar backup (SIN -c porque la BD está vacía)
pg_restore -h localhost -p 5432 -U postgres -d nexopos -v "C:\ruta\backup_archivo.backup"
```

---

### Opción 2: Desde archivo .backup (formato custom del sistema)

```bash
# SOLO si la base de datos está vacía o es nueva
pg_restore -h localhost -p 5432 -U postgres -d nexopos -v "C:\ruta\backup_archivo.backup"
```

### Opción 3: Desde archivo .sql (texto plano)

```bash
psql -h localhost -p 5432 -U postgres -d nexopos < "C:\ruta\backup_archivo.sql"
```

---

## 📁 Ubicación de los backups del sistema

El sistema guarda los backups en:
- **Ruta**: `C:\Users\agust\Desktop\backups\` (fuera del proyecto)
- **Formato de archivo**: `.backup` (formato custom comprimido de PostgreSQL)
- **Nombre**: `backup_YYYY-MM-DDTHH-MM-SS.backup` (ej: `backup_2026-01-20T21-13-42.backup`)

---

## Script de Backup Automatizado (Windows)

Crea un archivo `backup-db.bat` en tu escritorio:

```batch
@echo off
setlocal

REM Configuración
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_NAME=nexopos
set PGPASSWORD=491467Aguxd!

REM Directorio de backups
set BACKUP_DIR=%USERPROFILE%\Desktop\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Nombre del archivo con fecha
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.backup

REM Crear backup
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F c -b -v -f "%BACKUP_FILE%" %DB_NAME%

echo.
echo ========================================
echo   Backup completado exitosamente
echo   Ubicacion: %BACKUP_FILE%
echo ========================================
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
BACKUP_DIR="$HOME/Desktop/backups"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con fecha
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).backup"

# Crear backup
PGPASSWORD="491467Aguxd!" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v -f "$BACKUP_FILE" "$DB_NAME"

echo "========================================"
echo "Backup completado exitosamente"
echo "Ubicación: $BACKUP_FILE"
echo "========================================"
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

### ❌ Error: "no existe la restricción FK_xxx" / "no se pueden eliminar múltiples llaves primarias"

**Problema**: Dependencias circulares entre tablas (users → refresh_tokens → products → stock_movements)

**Solución**: Usar el método de eliminar y recrear la base de datos:
```bash
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS nexopos; CREATE DATABASE nexopos;" && pg_restore -h localhost -p 5432 -U postgres -d nexopos "C:\ruta\backup.backup"
```

### Error: "connection refused"
Verifica que PostgreSQL esté corriendo en el puerto 5432:
```bash
# Windows
netstat -an | findstr 5432

# Linux/Mac
netstat -tuln | grep 5432
```

### Error: "password authentication failed"
Verifica tu contraseña en `.env`:
```bash
DATABASE_PASSWORD=491467Aguxd!
```

### Error: "database does not exist"
```bash
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE nexopos;"
```

### Error: "no se permiten múltiples llaves primarias"
La base de datos tiene datos restantes. **Debes eliminar la base de datos completamente** (ver solución arriba).
