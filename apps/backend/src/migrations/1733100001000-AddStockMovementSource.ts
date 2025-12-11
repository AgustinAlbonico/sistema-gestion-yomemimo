import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockMovementSource1733100001000 implements MigrationInterface {
    name = 'AddStockMovementSource1733100001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear el enum para source
        await queryRunner.query(`
            CREATE TYPE "stock_movement_source_enum" AS ENUM (
                'INITIAL_LOAD',
                'PURCHASE',
                'SALE',
                'ADJUSTMENT',
                'RETURN'
            )
        `);

        // Agregar columna source con valor por defecto
        await queryRunner.query(`
            ALTER TABLE "stock_movements" 
            ADD COLUMN "source" "stock_movement_source_enum" NOT NULL DEFAULT 'ADJUSTMENT'
        `);

        // Agregar columna referenceId
        await queryRunner.query(`
            ALTER TABLE "stock_movements" 
            ADD COLUMN "reference_id" varchar(255) NULL
        `);

        // Crear índice para source
        await queryRunner.query(`
            CREATE INDEX "IDX_stock_movements_source" ON "stock_movements" ("source")
        `);

        // Actualizar registros existentes: los que tienen provider se marcan como PURCHASE
        await queryRunner.query(`
            UPDATE "stock_movements" 
            SET "source" = 'PURCHASE' 
            WHERE "provider" IS NOT NULL AND "provider" != ''
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índice
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_movements_source"`);

        // Eliminar columnas
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "reference_id"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "source"`);

        // Eliminar el tipo enum
        await queryRunner.query(`DROP TYPE IF EXISTS "stock_movement_source_enum"`);
    }
}
