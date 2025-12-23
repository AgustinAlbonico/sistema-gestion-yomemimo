/**
 * Script para crear la tabla audit_logs manualmente
 */
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sistema_gestion',
});

(async () => {
    try {
        await dataSource.initialize();
        console.log('Conectado a la base de datos');

        // Crear la tabla si no existe
        await dataSource.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                entity_type VARCHAR(50) NOT NULL,
                entity_id UUID NOT NULL,
                action VARCHAR(20) NOT NULL,
                user_id UUID NOT NULL REFERENCES users(id),
                previous_values JSONB,
                new_values JSONB,
                metadata JSONB,
                description VARCHAR(500),
                "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabla audit_logs creada (si no existía)');

        // Crear índices
        await dataSource.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
            CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs("timestamp");
            CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
        `);
        console.log('Índices creados');

        // Verificar
        const result = await dataSource.query(`SELECT COUNT(*) FROM audit_logs`);
        console.log('Registros en audit_logs:', result[0].count);

        await dataSource.destroy();
        console.log('Conexión cerrada');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exitCode = 1;
    }
})();
