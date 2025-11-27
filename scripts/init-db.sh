#!/bin/bash
set -e

echo "🚀 Inicializando base de datos..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "unaccent";
    SET timezone = 'America/Argentina/Buenos_Aires';
    SELECT 'Base de datos inicializada correctamente' AS status;
EOSQL

echo "✅ Base de datos inicializada correctamente"
