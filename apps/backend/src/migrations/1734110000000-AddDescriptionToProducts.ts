import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToProducts1734110000000 implements MigrationInterface {
    name = 'AddDescriptionToProducts1734110000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columna description a la tabla products
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD COLUMN IF NOT EXISTS "description" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir: eliminar la columna description
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP COLUMN IF EXISTS "description"
        `);
    }
}
