import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

async function applyChanges() {
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number.parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'sistema_gestion',
        logging: true,
    });

    try {
        await ds.initialize();
        console.log('✅ Conectado');

        // 1. Agregar columna profitMargin a categories
        console.log('Agregando columna profitMargin a categories...');
        await ds.query(`
            ALTER TABLE "categories" 
            ADD COLUMN IF NOT EXISTS "profitMargin" decimal(5,2) NULL
        `);

        // 2. Verificar si la columna categoryId existe en products
        const hasColumn = await ds.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'categoryId'
        `);

        if (hasColumn.length === 0) {
            console.log('Agregando columna categoryId a products...');
            await ds.query(`
                ALTER TABLE "products" 
                ADD COLUMN "categoryId" uuid NULL
            `);

            // 3. Migrar datos de la tabla intermedia product_categories
            const tableExists = await ds.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'product_categories'
                )
            `);

            if (tableExists[0]?.exists) {
                console.log('Migrando datos desde product_categories...');
                await ds.query(`
                    UPDATE "products" p
                    SET "categoryId" = (
                        SELECT pc."category_id" 
                        FROM "product_categories" pc 
                        WHERE pc."product_id" = p.id 
                        LIMIT 1
                    )
                    WHERE p."categoryId" IS NULL
                `);
            }

            // 4. Agregar foreign key
            console.log('Agregando foreign key...');
            await ds.query(`
                ALTER TABLE "products" 
                DROP CONSTRAINT IF EXISTS "FK_products_category"
            `);

            await ds.query(`
                ALTER TABLE "products" 
                ADD CONSTRAINT "FK_products_category" 
                FOREIGN KEY ("categoryId") REFERENCES "categories"("id") 
                ON DELETE SET NULL
            `);

            // 5. Crear índice
            console.log('Creando índice...');
            await ds.query(`
                CREATE INDEX IF NOT EXISTS "IDX_products_categoryId" ON "products"("categoryId")
            `);
        } else {
            console.log('La columna categoryId ya existe');
        }

        console.log('✅ Cambios aplicados correctamente');
        await ds.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await ds.destroy();
        process.exit(1);
    }
}

applyChanges();
