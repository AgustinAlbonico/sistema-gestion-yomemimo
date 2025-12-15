import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

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
        await dataSource.initialize();

        // Verificar customer_accounts
        const accountsExists = await dataSource.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'customer_accounts'
            )`
        );

        // Verificar account_movements
        const movementsExists = await dataSource.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'account_movements'
            )`
        );

        console.log('📊 Estado de tablas:');
        console.log(`   customer_accounts: ${accountsExists[0].exists ? '✅ Existe' : '❌ No existe'}`);
        console.log(`   account_movements: ${movementsExists[0].exists ? '✅ Existe' : '❌ No existe'}`);

        if (accountsExists[0].exists) {
            const accountsCount = await dataSource.query('SELECT COUNT(*) FROM customer_accounts');
            console.log(`\n📈 Registros en customer_accounts: ${accountsCount[0].count}`);
        }

        if (movementsExists[0].exists) {
            const movementsCount = await dataSource.query('SELECT COUNT(*) FROM account_movements');
            console.log(`📈 Registros en account_movements: ${movementsCount[0].count}`);
        }

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
