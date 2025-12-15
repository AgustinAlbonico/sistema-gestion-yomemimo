import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManualMovementFields1734228600000 implements MigrationInterface {
    name = 'AddManualMovementFields1734228600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar campos para movimientos manuales a la tabla cash_movements
        await queryRunner.query(`
            ALTER TABLE "cash_movements" 
            ADD COLUMN IF NOT EXISTS "manualAmount" numeric(12,2),
            ADD COLUMN IF NOT EXISTS "manualDescription" varchar(200),
            ADD COLUMN IF NOT EXISTS "manual_payment_method_id" uuid,
            ADD COLUMN IF NOT EXISTS "manualNotes" varchar(1000)
        `);

        // Crear índice para búsquedas por tipo de movimiento manual
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_cash_movements_manual" 
            ON "cash_movements" ("referenceType") 
            WHERE "referenceType" = 'manual'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índice
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cash_movements_manual"`);

        // Eliminar columnas
        await queryRunner.query(`
            ALTER TABLE "cash_movements" 
            DROP COLUMN IF EXISTS "manualAmount",
            DROP COLUMN IF EXISTS "manualDescription",
            DROP COLUMN IF EXISTS "manual_payment_method_id",
            DROP COLUMN IF EXISTS "manualNotes"
        `);
    }
}
