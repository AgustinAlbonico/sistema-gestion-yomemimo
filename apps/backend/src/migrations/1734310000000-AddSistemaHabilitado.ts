import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para agregar campos de control de acceso al sistema
 * - sistemaHabilitado: boolean para habilitar/deshabilitar el sistema remotamente
 * - mensajeDeshabilitado: mensaje a mostrar cuando el sistema está deshabilitado
 */
export class AddSistemaHabilitado1734310000000 implements MigrationInterface {
    name = 'AddSistemaHabilitado1734310000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar si la columna ya existe
        const hasColumn = await queryRunner.hasColumn('system_configuration', 'sistemaHabilitado');

        if (!hasColumn) {
            await queryRunner.query(`
                ALTER TABLE "system_configuration" 
                ADD COLUMN "sistemaHabilitado" boolean NOT NULL DEFAULT true
            `);
            console.log('✅ Columna sistemaHabilitado agregada');
        }

        const hasMensaje = await queryRunner.hasColumn('system_configuration', 'mensajeDeshabilitado');
        if (!hasMensaje) {
            await queryRunner.query(`
                ALTER TABLE "system_configuration" 
                ADD COLUMN "mensajeDeshabilitado" varchar(500) NULL
            `);
            console.log('✅ Columna mensajeDeshabilitado agregada');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "system_configuration" 
            DROP COLUMN IF EXISTS "mensajeDeshabilitado"
        `);
        await queryRunner.query(`
            ALTER TABLE "system_configuration" 
            DROP COLUMN IF EXISTS "sistemaHabilitado"
        `);
    }
}
