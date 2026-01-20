import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para cambiar las columnas lastPaymentDate y lastPurchaseDate
 * de tipo 'date' a 'timestamp' para capturar la hora exacta.
 *
 * Esto permite mostrar correctamente "hace X minutos/horas" en la UI
 * en lugar de solo la fecha.
 *
 * Esta versión es idempotente - verifica el tipo antes de cambiarlo.
 */
export class UpdateAccountDateColumnsToTimestamp1735498200000 implements MigrationInterface {
    name = 'UpdateAccountDateColumnsToTimestamp1735498200000';

    /**
     * Obtiene el tipo de datos de una columna
     */
    private async getColumnType(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<string | null> {
        const result = await queryRunner.query(`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
        `, [tableName, columnName]);
        return result[0]?.data_type || null;
    }

    /**
     * Verifica si una columna existe en una tabla
     */
    private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                AND column_name = $2
            )
        `, [tableName, columnName]);
        return result[0]?.exists || false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar y cambiar lastPaymentDate de date a timestamp si es necesario
        if (await this.columnExists(queryRunner, 'customer_accounts', 'lastPaymentDate')) {
            const currentType = await this.getColumnType(queryRunner, 'customer_accounts', 'lastPaymentDate');
            if (currentType === 'date') {
                await queryRunner.query(`
                    ALTER TABLE "customer_accounts"
                    ALTER COLUMN "lastPaymentDate" TYPE timestamp without time zone
                    USING "lastPaymentDate"::timestamp without time zone
                `);
            }
        }

        // Verificar y cambiar lastPurchaseDate de date a timestamp si es necesario
        if (await this.columnExists(queryRunner, 'customer_accounts', 'lastPurchaseDate')) {
            const currentType = await this.getColumnType(queryRunner, 'customer_accounts', 'lastPurchaseDate');
            if (currentType === 'date') {
                await queryRunner.query(`
                    ALTER TABLE "customer_accounts"
                    ALTER COLUMN "lastPurchaseDate" TYPE timestamp without time zone
                    USING "lastPurchaseDate"::timestamp without time zone
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir a date solo si actualmente son timestamp
        if (await this.columnExists(queryRunner, 'customer_accounts', 'lastPaymentDate')) {
            const currentType = await this.getColumnType(queryRunner, 'customer_accounts', 'lastPaymentDate');
            if (currentType === 'timestamp without time zone') {
                await queryRunner.query(`
                    ALTER TABLE "customer_accounts"
                    ALTER COLUMN "lastPaymentDate" TYPE date
                    USING "lastPaymentDate"::date
                `);
            }
        }

        if (await this.columnExists(queryRunner, 'customer_accounts', 'lastPurchaseDate')) {
            const currentType = await this.getColumnType(queryRunner, 'customer_accounts', 'lastPurchaseDate');
            if (currentType === 'timestamp without time zone') {
                await queryRunner.query(`
                    ALTER TABLE "customer_accounts"
                    ALTER COLUMN "lastPurchaseDate" TYPE date
                    USING "lastPurchaseDate"::date
                `);
            }
        }
    }
}
