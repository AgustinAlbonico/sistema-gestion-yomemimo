import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración para simplificar la tabla brands:
 * - Elimina la columna 'displayName' (redundante)
 * - Mantiene solo 'name' como columna única
 */
export class SimplifyBrandsTable1768003659000 implements MigrationInterface {
    name = 'SimplifyBrandsTable1768003659000'

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
        // Solo proceder si la columna displayName existe
        if (await this.columnExists(queryRunner, 'brands', 'displayName')) {
            // Primero, copiar los valores de displayName a name si name está vacío o es diferente
            // Esto asegura que no perdemos datos
            await queryRunner.query(`
                UPDATE "brands" SET "name" = COALESCE(NULLIF("name", ''), "displayName") WHERE "displayName" IS NOT NULL
            `);

            // Eliminar la columna displayName
            await queryRunner.query(`
                ALTER TABLE "brands" DROP COLUMN IF EXISTS "displayName"
            `);
        }

        // Eliminar el índice único anterior si existe (basado en name lowercase)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_96db6bbbaa6f23cad26871339b"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Solo proceder si la columna displayName NO existe
        if (!await this.columnExists(queryRunner, 'brands', 'displayName')) {
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
        }

        // Recrear el índice si no existe
        const indexExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                AND indexname = 'IDX_96db6bbbaa6f23cad26871339b'
            )
        `);
        if (!indexExists[0]?.exists) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX "IDX_96db6bbbaa6f23cad26871339b" ON "brands" ("name")
            `);
        }
    }
}
