import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// Cargar variables de entorno
config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sistema_gestion',
});

(async () => {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await dataSource.initialize();

        console.log('✅ Conexión establecida');
        console.log('📝 Marcando migraciones existentes como ejecutadas...\n');

        // Verificar si existe la tabla migrations
        const hasTable = await dataSource.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'migrations'
            )`
        );

        if (!hasTable[0].exists) {
            console.log('📋 Creando tabla de migraciones...');
            await dataSource.query(
                `CREATE TABLE "migrations" (
                    "id" SERIAL NOT NULL,
                    "timestamp" bigint NOT NULL,
                    "name" character varying NOT NULL,
                    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
                )`
            );
        }

        // Obtener migraciones existentes
        const existingMigrations = await dataSource.query(
            `SELECT name FROM migrations ORDER BY timestamp`
        );

        const existingNames = (existingMigrations as Array<{ name: string }>).map(m => m.name);
        console.log('✨ Migraciones ya registradas:');
        existingNames.forEach((name: string) => console.log(`   - ${name}`));
        console.log();

        // Lista de migraciones que deberían estar registradas
        const migrations = [
            { timestamp: 1733079863000, name: 'CreateCashRegisterTables1733079863000' },
            { timestamp: 1733100000000, name: 'CreateCashRegisterTotals1733100000000' },
            { timestamp: 1733100001000, name: 'AddStockMovementSource1733100001000' },
            { timestamp: 1733535600000, name: 'CreateCustomerAccountsTables1733535600000' },
        ];

        let registered = 0;
        for (const migration of migrations) {
            if (!existingNames.includes(migration.name)) {
                await dataSource.query(
                    `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
                    [migration.timestamp, migration.name]
                );
                console.log(`✅ Registrada: ${migration.name}`);
                registered++;
            }
        }

        if (registered === 0) {
            console.log('✨ Todas las migraciones ya estaban registradas');
        } else {
            console.log(`\n✅ ${registered} migración(es) registrada(s)`);
        }

        console.log('\n🎉 Proceso completado');
        process.exitCode = 0;

    } catch (error) {
        console.error('❌ Error:', error);
        process.exitCode = 1;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
})();
