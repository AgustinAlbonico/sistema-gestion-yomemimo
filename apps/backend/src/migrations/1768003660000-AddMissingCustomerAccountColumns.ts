import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración de reparación para agregar columnas faltantes en customer_accounts.
 * Esta migración es idempotente - verifica si la columna existe antes de agregarla.
 */
export class AddMissingCustomerAccountColumns1768003660000 implements MigrationInterface {
    name = 'AddMissingCustomerAccountColumns1768003660000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar y agregar paymentTermDays si no existe
        const hasPaymentTermDays = await this.columnExists(queryRunner, 'customer_accounts', 'paymentTermDays');
        if (!hasPaymentTermDays) {
            await queryRunner.query(`
                ALTER TABLE "customer_accounts" 
                ADD COLUMN "paymentTermDays" integer NOT NULL DEFAULT 30
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_customer_accounts_paymentTermDays" 
                ON "customer_accounts" ("paymentTermDays")
            `);
        }

        // Verificar y agregar daysOverdue si no existe
        const hasDaysOverdue = await this.columnExists(queryRunner, 'customer_accounts', 'daysOverdue');
        if (!hasDaysOverdue) {
            await queryRunner.query(`
                ALTER TABLE "customer_accounts" 
                ADD COLUMN "daysOverdue" integer NOT NULL DEFAULT 0
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_customer_accounts_daysOverdue" 
                ON "customer_accounts" ("daysOverdue")
            `);
        }

        // Verificar y agregar índices de balance y status si no existen
        const hasBalanceIndex = await this.indexExists(queryRunner, 'IDX_customer_accounts_balance');
        if (!hasBalanceIndex) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_customer_accounts_balance" 
                ON "customer_accounts" ("balance")
            `);
        }

        const hasStatusIndex = await this.indexExists(queryRunner, 'IDX_customer_accounts_status');
        if (!hasStatusIndex) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_customer_accounts_status" 
                ON "customer_accounts" ("status")
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No hacemos down porque estas columnas son necesarias para el funcionamiento
        // y podrían haber sido creadas por la migración inicial
    }

    private async columnExists(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = $2
        `, [table, column]);
        return result.length > 0;
    }

    private async indexExists(queryRunner: QueryRunner, indexName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname = $1
        `, [indexName]);
        return result.length > 0;
    }
}
