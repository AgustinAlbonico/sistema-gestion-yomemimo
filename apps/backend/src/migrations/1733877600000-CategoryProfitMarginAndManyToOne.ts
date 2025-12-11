import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para:
 * 1. Cambiar la relación producto-categoría de ManyToMany a ManyToOne
 * 2. Agregar columna profit_margin a la tabla categories
 * 3. Migrar datos de la tabla intermedia product_categories a la nueva columna categoryId
 */
export class CategoryProfitMarginAndManyToOne1733877600000 implements MigrationInterface {
    name = 'CategoryProfitMarginAndManyToOne1733877600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Agregar columna profit_margin a categories
        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD COLUMN IF NOT EXISTS "profitMargin" decimal(5,2) NULL
        `);

        // 2. Agregar columna categoryId a products (si no existe)
        const hasColumn = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'categoryId'
        `);

        if (hasColumn.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "products" 
                ADD COLUMN "categoryId" uuid NULL
            `);
        }

        // 3. Migrar datos de la tabla intermedia product_categories
        // Tomamos la primera categoría de cada producto (si tiene múltiples)
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'product_categories'
            )
        `);

        if (tableExists[0]?.exists) {
            // Migrar la primera categoría de cada producto
            await queryRunner.query(`
                UPDATE "products" p
                SET "categoryId" = (
                    SELECT pc."category_id" 
                    FROM "product_categories" pc 
                    WHERE pc."product_id" = p.id 
                    LIMIT 1
                )
                WHERE p."categoryId" IS NULL
            `);

            // Dropping the junction table (comentado para mantener backup)
            // await queryRunner.query(`DROP TABLE IF EXISTS "product_categories"`);
        }

        // 4. Agregar foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP CONSTRAINT IF EXISTS "FK_products_category"
        `);

        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_products_category" 
            FOREIGN KEY ("categoryId") REFERENCES "categories"("id") 
            ON DELETE SET NULL
        `);

        // 5. Crear índice para categoryId
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_products_categoryId" ON "products"("categoryId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Eliminar índice
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_categoryId"`);

        // 2. Eliminar foreign key
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP CONSTRAINT IF EXISTS "FK_products_category"
        `);

        // 3. Si se eliminó la tabla intermedia, recrearla
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "product_categories" (
                "product_id" uuid NOT NULL,
                "category_id" uuid NOT NULL,
                PRIMARY KEY ("product_id", "category_id"),
                CONSTRAINT "FK_product_categories_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_product_categories_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
            )
        `);

        // 4. Migrar datos de vuelta a la tabla intermedia
        await queryRunner.query(`
            INSERT INTO "product_categories" ("product_id", "category_id")
            SELECT id, "categoryId" FROM "products" WHERE "categoryId" IS NOT NULL
            ON CONFLICT DO NOTHING
        `);

        // 5. Eliminar columna categoryId de products
        await queryRunner.query(`
            ALTER TABLE "products" DROP COLUMN IF EXISTS "categoryId"
        `);

        // 6. Eliminar columna profitMargin de categories
        await queryRunner.query(`
            ALTER TABLE "categories" DROP COLUMN IF EXISTS "profitMargin"
        `);
    }
}
