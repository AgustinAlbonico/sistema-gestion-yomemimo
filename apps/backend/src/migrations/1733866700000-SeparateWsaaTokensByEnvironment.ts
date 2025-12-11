import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para separar los tokens WSAA por ambiente (homologación y producción)
 * Esto permite mantener tokens separados para cada ambiente y no perderlos al cambiar
 */
export class SeparateWsaaTokensByEnvironment1733866700000 implements MigrationInterface {
    name = 'SeparateWsaaTokensByEnvironment1733866700000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columnas para tokens de homologación
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_token_homologacion" text
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_sign_homologacion" text
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_token_expiration_homologacion" timestamp
        `);

        // Agregar columnas para tokens de producción
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_token_produccion" text
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_sign_produccion" text
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_token_expiration_produccion" timestamp
        `);

        // Migrar datos existentes al ambiente correspondiente
        // El token existente se asigna al ambiente de homologación por defecto
        // ya que era el más probable en uso durante desarrollo
        await queryRunner.query(`
            UPDATE "fiscal_configuration" 
            SET 
                "wsaa_token_homologacion" = "wsaa_token",
                "wsaa_sign_homologacion" = "wsaa_sign",
                "wsaa_token_expiration_homologacion" = "wsaa_token_expiration"
            WHERE "wsaa_token" IS NOT NULL
        `);

        // Eliminar columnas antiguas
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_token"
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_sign"
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_token_expiration"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurar columnas originales
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_token" text
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_sign" text
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            ADD COLUMN IF NOT EXISTS "wsaa_token_expiration" timestamp
        `);

        // Migrar datos de homologación a las columnas originales
        await queryRunner.query(`
            UPDATE "fiscal_configuration" 
            SET 
                "wsaa_token" = "wsaa_token_homologacion",
                "wsaa_sign" = "wsaa_sign_homologacion",
                "wsaa_token_expiration" = "wsaa_token_expiration_homologacion"
            WHERE "wsaa_token_homologacion" IS NOT NULL
        `);

        // Eliminar columnas nuevas
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_token_homologacion"
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_sign_homologacion"
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_token_expiration_homologacion"
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_token_produccion"
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_sign_produccion"
        `);
        await queryRunner.query(`
            ALTER TABLE "fiscal_configuration" 
            DROP COLUMN IF EXISTS "wsaa_token_expiration_produccion"
        `);
    }
}
