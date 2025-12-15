import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveExpenseCategoryFields1734095590000 implements MigrationInterface {
    name = 'RemoveExpenseCategoryFields1734095590000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Eliminar columnas innecesarias de expense_categories
        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            DROP COLUMN IF EXISTS "description"
        `);

        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            DROP COLUMN IF EXISTS "isRecurring"
        `);

        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            DROP COLUMN IF EXISTS "updatedAt"
        `);

        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            DROP COLUMN IF EXISTS "deletedAt"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir: agregar las columnas de vuelta
        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            ADD COLUMN "description" text
        `);

        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            ADD COLUMN "isRecurring" boolean NOT NULL DEFAULT false
        `);

        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            ADD COLUMN "updatedAt" timestamp NOT NULL DEFAULT now()
        `);

        await queryRunner.query(`
            ALTER TABLE "expense_categories" 
            ADD COLUMN "deletedAt" timestamp
        `);
    }
}
