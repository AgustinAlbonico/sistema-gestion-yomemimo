import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración de mejoras de esquema basada en auditoría:
 * 1. Eliminar columnas duplicadas en refresh_tokens y stock_movements
 * 2. Unificar enums documenttype
 * 3. Agregar índices faltantes para performance
 */
export class SchemaImprovements1768003661000 implements MigrationInterface {
    name = 'SchemaImprovements1768003661000'

    /**
     * Verifica si una columna existe en una tabla
     */
    private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = '${tableName}'
                AND column_name = '${columnName}'
            )
        `);
        return result[0]?.exists || false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ============================================
        // 1. CORREGIR COLUMNAS DUPLICADAS (si existen)
        // ============================================

        // refresh_tokens: verificar si existe columna user_id duplicada
        const hasUserIdSnake = await this.columnExists(queryRunner, 'refresh_tokens', 'user_id');
        if (hasUserIdSnake) {
            // Migrar datos de user_id a userId si es necesario
            await queryRunner.query(`
                UPDATE "refresh_tokens"
                SET "userId" = "user_id"
                WHERE "userId" IS NULL AND "user_id" IS NOT NULL
            `);

            // Eliminar la FK de user_id si existe
            await queryRunner.query(`
                ALTER TABLE "refresh_tokens"
                DROP CONSTRAINT IF EXISTS "FK_3ddc983c5f7bcf132fd8732c3f4"
            `);

            // Eliminar columna user_id duplicada
            await queryRunner.query(`
                ALTER TABLE "refresh_tokens"
                DROP COLUMN IF EXISTS "user_id"
            `);
        }

        // stock_movements: verificar si existe columna product_id duplicada
        const hasProductIdSnake = await this.columnExists(queryRunner, 'stock_movements', 'product_id');
        if (hasProductIdSnake) {
            // Migrar datos de product_id a productId si es necesario
            await queryRunner.query(`
                UPDATE "stock_movements"
                SET "productId" = "product_id"
                WHERE "productId" IS NULL AND "product_id" IS NOT NULL
            `);

            // Eliminar la FK de product_id si existe
            await queryRunner.query(`
                ALTER TABLE "stock_movements"
                DROP CONSTRAINT IF EXISTS "FK_2c1bb05b80ddcc562cd28d826c6"
            `);

            // Eliminar columna product_id duplicada
            await queryRunner.query(`
                ALTER TABLE "stock_movements"
                DROP COLUMN IF EXISTS "product_id"
            `);

            // Recrear FK para productId
            await queryRunner.query(`
                ALTER TABLE "stock_movements"
                ADD CONSTRAINT "FK_stock_movements_productId"
                FOREIGN KEY ("productId")
                REFERENCES "products"("id") ON DELETE CASCADE
            `);
        }

        // ============================================
        // 2. UNIFICAR ENUMS DOCUMENTTYPE
        // ============================================

        // Crear enum unificado con todos los valores posibles
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "document_type_enum" AS ENUM('DNI', 'CUIT', 'CUIL', 'PASAPORTE', 'OTRO');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Los enums existentes ya tienen los mismos valores
        // Solo documentamos que ahora se recomienda usar el enum unificado en nuevas features

        // ============================================
        // 3. AGREGAR ÍNDICES FALTANTES
        // ============================================

        // Índice para invoices.status (consultas de facturas pendientes)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_invoices_status" 
            ON "invoices" ("status")
        `);

        // Índice para invoices.sale_id (JOIN con sales)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_invoices_sale_id" 
            ON "invoices" ("sale_id")
        `);

        // Índice para sale_items.sale_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_sale_items_sale_id" 
            ON "sale_items" ("sale_id")
        `);

        // Índice para sale_items.product_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_sale_items_product_id" 
            ON "sale_items" ("product_id")
        `);

        // Índice para sale_payments.sale_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_sale_payments_sale_id" 
            ON "sale_payments" ("sale_id")
        `);

        // Índice para purchase_items.purchase_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_purchase_items_purchase_id" 
            ON "purchase_items" ("purchase_id")
        `);

        // Índice para purchase_items.product_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_purchase_items_product_id" 
            ON "purchase_items" ("product_id")
        `);

        // Índice para cash_movements.cash_register_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_cash_movements_cash_register_id" 
            ON "cash_movements" ("cash_register_id")
        `);

        // Índice para cash_movements.created_by
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_cash_movements_created_by" 
            ON "cash_movements" ("created_by")
        `);

        // Índice para incomes.category_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_incomes_category_id" 
            ON "incomes" ("category_id")
        `);

        // Índice para incomes.customer_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_incomes_customer_id" 
            ON "incomes" ("customer_id")
        `);

        // Índice para expenses.category_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_expenses_category_id" 
            ON "expenses" ("category_id")
        `);

        // Índice para account_movements.createdById
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_account_movements_createdById" 
            ON "account_movements" ("createdById")
        `);

        // Índice compuesto para sales por fecha y status (reportes)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_sales_date_status" 
            ON "sales" ("saleDate", "status")
        `);

        // Índice para products.brandId (si existe la columna)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_products_brandId" 
            ON "products" ("brandId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índices nuevos
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_sale_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sale_items_sale_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sale_items_product_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sale_payments_sale_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_items_purchase_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_items_product_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cash_movements_cash_register_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cash_movements_created_by"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incomes_category_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incomes_customer_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_expenses_category_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_movements_createdById"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_date_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_brandId"`);

        // El enum unificado se mantiene (no afecta nada)

        // Para revertir columnas duplicadas se necesitaría backfill,
        // lo cual no es recomendable. Mantener el estado actual.
    }
}
