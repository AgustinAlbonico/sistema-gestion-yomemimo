import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración para mejorar precisión de profitMargin y agregar constraints únicos.
 * Esta versión es idempotente - verifica la existencia de elementos antes de operar.
 */
export class IncreaseProfitMarginPrecision1768412960845 implements MigrationInterface {
    name = 'IncreaseProfitMarginPrecision1768412960845'

    /**
     * Verifica si un constraint existe
     */
    private async constraintExists(queryRunner: QueryRunner, tableName: string, constraintName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_schema = 'public'
                AND table_name = '${tableName}'
                AND constraint_name = '${constraintName}'
            )
        `);
        return result[0]?.exists || false;
    }

    /**
     * Verifica si un índice existe
     */
    private async indexExists(queryRunner: QueryRunner, indexName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                AND indexname = '${indexName}'
            )
        `);
        return result[0]?.exists || false;
    }

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
        // 1. ACTUALIZAR PRECISIÓN DE PROFIT MARGIN
        // ============================================

        // system_configuration.defaultProfitMargin: numeric(5,2) -> numeric(10,2)
        await queryRunner.query(`
            ALTER TABLE "system_configuration" ALTER COLUMN "defaultProfitMargin" TYPE numeric(10,2)
        `);

        // categories.profitMargin: numeric(5,2) -> numeric(10,2)
        await queryRunner.query(`
            ALTER TABLE "categories" ALTER COLUMN "profitMargin" TYPE numeric(10,2)
        `);

        // products.profitMargin: numeric(5,2) -> numeric(10,2)
        await queryRunner.query(`
            ALTER TABLE "products" ALTER COLUMN "profitMargin" TYPE numeric(10,2)
        `);

        // ============================================
        // 2. ELIMINAR COLUMNA isActive DE brands (si existe)
        // ============================================
        if (await this.columnExists(queryRunner, 'brands', 'isActive')) {
            await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "isActive"`);
        }

        // ============================================
        // 3. AGREGAR CONSTRAINTS ÚNICOS (si no existen)
        // ============================================

        // refresh_tokens.token UNIQUE
        if (!await this.constraintExists(queryRunner, 'refresh_tokens', 'UQ_4542dd2f38a61354a040ba9fd57')) {
            await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token")`);
        }

        // users.username UNIQUE
        if (!await this.constraintExists(queryRunner, 'users', 'UQ_fe0bb3f6520ee0469504521e710')) {
            await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        }

        // payment_methods.name UNIQUE
        if (!await this.constraintExists(queryRunner, 'payment_methods', 'UQ_a793d7354d7c3aaf76347ee5a66')) {
            await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66" UNIQUE ("name")`);
        }

        // payment_methods.code UNIQUE
        if (!await this.constraintExists(queryRunner, 'payment_methods', 'UQ_f8aad3eab194dfdae604ca11125')) {
            await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_f8aad3eab194dfdae604ca11125" UNIQUE ("code")`);
        }

        // customer_categories.name UNIQUE
        if (!await this.constraintExists(queryRunner, 'customer_categories', 'UQ_ede93c8cf28e307313ec668e730')) {
            await queryRunner.query(`ALTER TABLE "customer_categories" ADD CONSTRAINT "UQ_ede93c8cf28e307313ec668e730" UNIQUE ("name")`);
        }

        // customers.documentNumber UNIQUE
        if (!await this.constraintExists(queryRunner, 'customers', 'UQ_dffea8343d90688bccac70b63ad')) {
            await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_dffea8343d90688bccac70b63ad" UNIQUE ("documentNumber")`);
        }

        // expense_categories.name UNIQUE
        if (!await this.constraintExists(queryRunner, 'expense_categories', 'UQ_6bdb3db95dd955d3c701e935426')) {
            await queryRunner.query(`ALTER TABLE "expense_categories" ADD CONSTRAINT "UQ_6bdb3db95dd955d3c701e935426" UNIQUE ("name")`);
        }

        // income_categories.name UNIQUE
        if (!await this.constraintExists(queryRunner, 'income_categories', 'UQ_9bfab959a7960a323bcf1d118cf')) {
            await queryRunner.query(`ALTER TABLE "income_categories" ADD CONSTRAINT "UQ_9bfab959a7960a323bcf1d118cf" UNIQUE ("name")`);
        }

        // categories.name UNIQUE
        if (!await this.constraintExists(queryRunner, 'categories', 'UQ_8b0be371d28245da6e4f4b61878')) {
            await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name")`);
        }

        // suppliers.documentNumber UNIQUE
        if (!await this.constraintExists(queryRunner, 'suppliers', 'UQ_939b78561f0b4da019d2f1bdcc4')) {
            await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "UQ_939b78561f0b4da019d2f1bdcc4" UNIQUE ("documentNumber")`);
        }

        // purchases.purchaseNumber UNIQUE
        if (!await this.constraintExists(queryRunner, 'purchases', 'UQ_59712045f2664aeb8a046928981')) {
            await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "UQ_59712045f2664aeb8a046928981" UNIQUE ("purchaseNumber")`);
        }

        // sales.saleNumber UNIQUE
        if (!await this.constraintExists(queryRunner, 'sales', 'UQ_12c072f5150ca7d495b07aa1c6e')) {
            await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "UQ_12c072f5150ca7d495b07aa1c6e" UNIQUE ("saleNumber")`);
        }

        // ============================================
        // 4. ACTUALIZAR ENUM backups_status_enum
        // ============================================
        try {
            await queryRunner.query(`ALTER TYPE "public"."backups_status_enum" RENAME TO "backups_status_enum_old"`);
            await queryRunner.query(`CREATE TYPE "public"."backups_status_enum" AS ENUM('completed', 'failed')`);
            await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" TYPE "public"."backups_status_enum" USING "status"::"text"::"public"."backups_status_enum"`);
            await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" SET DEFAULT 'completed'`);
            await queryRunner.query(`DROP TYPE "public"."backups_status_enum_old"`);
        } catch (error) {
            // Si el enum ya fue actualizado, continuar
            const err = error as { code?: string; message?: string };
            if (!err.message?.includes('already exists') && !err.message?.includes('does not exist')) {
                throw error;
            }
        }

        // ============================================
        // 5. ACTUALIZAR FOREIGN KEYS (si es necesario)
        // ============================================

        // Recrear FK de refresh_tokens.userId si es necesario
        if (await this.constraintExists(queryRunner, 'refresh_tokens', 'FK_3ddc983c5f7bcf132fd8732c3f4')) {
            await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        }
        if (!await this.constraintExists(queryRunner, 'refresh_tokens', 'FK_610102b60fea1455310ccd299de')) {
            await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        }

        // Recrear FK de stock_movements.productId si es necesario
        if (await this.constraintExists(queryRunner, 'stock_movements', 'FK_2c1bb05b80ddcc562cd28d826c6')) {
            await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"`);
        }
        if (!await this.constraintExists(queryRunner, 'stock_movements', 'FK_a3acb59db67e977be45e382fc56')) {
            await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_a3acb59db67e977be45e382fc56" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir precisión de profitMargin
        await queryRunner.query(`ALTER TABLE "system_configuration" ALTER COLUMN "defaultProfitMargin" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "profitMargin" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "profitMargin" TYPE numeric(5,2)`);

        // Recrear columna isActive en brands
        if (!await this.columnExists(queryRunner, 'brands', 'isActive')) {
            await queryRunner.query(`ALTER TABLE "brands" ADD "isActive" boolean NOT NULL DEFAULT true`);
        }

        // Eliminar constraints únicos agregados
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "UQ_12c072f5150ca7d495b07aa1c6e"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "UQ_59712045f2664aeb8a046928981"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT IF EXISTS "UQ_939b78561f0b4da019d2f1bdcc4"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "UQ_8b0be371d28245da6e4f4b61878"`);
        await queryRunner.query(`ALTER TABLE "income_categories" DROP CONSTRAINT IF EXISTS "UQ_9bfab959a7960a323bcf1d118cf"`);
        await queryRunner.query(`ALTER TABLE "expense_categories" DROP CONSTRAINT IF EXISTS "UQ_6bdb3db95dd955d3c701e935426"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "UQ_dffea8343d90688bccac70b63ad"`);
        await queryRunner.query(`ALTER TABLE "customer_categories" DROP CONSTRAINT IF EXISTS "UQ_ede93c8cf28e307313ec668e730"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT IF EXISTS "UQ_f8aad3eab194dfdae604ca11125"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT IF EXISTS "UQ_a793d7354d7c3aaf76347ee5a66"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "UQ_4542dd2f38a61354a040ba9fd57"`);

        // Revertir enum backups_status_enum
        try {
            await queryRunner.query(`CREATE TYPE "public"."backups_status_enum_old" AS ENUM('pending', 'completed', 'failed')`);
            await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" TYPE "public"."backups_status_enum_old" USING "status"::"text"::"public"."backups_status_enum_old"`);
            await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" SET DEFAULT 'pending'`);
            await queryRunner.query(`DROP TYPE "public"."backups_status_enum"`);
            await queryRunner.query(`ALTER TYPE "public"."backups_status_enum_old" RENAME TO "backups_status_enum"`);
        } catch (error) {
            // Si ya fue revertido, continuar
        }

        // Revertir foreign keys
        if (await this.constraintExists(queryRunner, 'refresh_tokens', 'FK_610102b60fea1455310ccd299de')) {
            await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        }
        if (!await this.constraintExists(queryRunner, 'refresh_tokens', 'FK_3ddc983c5f7bcf132fd8732c3f4')) {
            await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        }

        if (await this.constraintExists(queryRunner, 'stock_movements', 'FK_a3acb59db67e977be45e382fc56')) {
            await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_a3acb59db67e977be45e382fc56"`);
        }
        if (!await this.constraintExists(queryRunner, 'stock_movements', 'FK_2c1bb05b80ddcc562cd28d826c6')) {
            await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        }
    }
}
