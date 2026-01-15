import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración para simplificar la tabla brands:
 * - Elimina la columna 'displayName' (redundante)
 * - Mantiene solo 'name' como columna única
 */
export class SimplifyBrandsTable1768003659000 implements MigrationInterface {
    name = 'SimplifyBrandsTable1768003659000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Primero, copiar los valores de displayName a name si name está vacío o es diferente
        // Esto asegura que no perdemos datos
        await queryRunner.query(`
            UPDATE "brands" SET "name" = "displayName" WHERE "displayName" IS NOT NULL
        `);

        // Eliminar la columna displayName
        await queryRunner.query(`
            ALTER TABLE "brands" DROP COLUMN IF EXISTS "displayName"
        `);

        // Eliminar el índice único anterior si existe (basado en name lowercase)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_96db6bbbaa6f23cad26871339b"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recrear la columna displayName
        await queryRunner.query(`
            ALTER TABLE "brands" ADD COLUMN "displayName" character varying(100)
        `);

        // Copiar name a displayName
        await queryRunner.query(`
            UPDATE "brands" SET "displayName" = "name"
        `);

        // Hacer displayName NOT NULL
        await queryRunner.query(`
            ALTER TABLE "brands" ALTER COLUMN "displayName" SET NOT NULL
        `);

        // Recrear el índice
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_96db6bbbaa6f23cad26871339b" ON "brands" ("name")
        `);
    }
}
