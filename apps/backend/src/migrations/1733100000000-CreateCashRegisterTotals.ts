import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCashRegisterTotals1733100000000 implements MigrationInterface {
    name = 'CreateCashRegisterTotals1733100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear tabla cash_register_totals
        await queryRunner.query(`
            CREATE TABLE "cash_register_totals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cash_register_id" uuid NOT NULL,
                "payment_method" character varying NOT NULL,
                "initial_amount" numeric(12,2) NOT NULL DEFAULT 0,
                "total_income" numeric(12,2) NOT NULL DEFAULT 0,
                "total_expense" numeric(12,2) NOT NULL DEFAULT 0,
                "expected_amount" numeric(12,2) NOT NULL DEFAULT 0,
                "actual_amount" numeric(12,2),
                "difference" numeric(12,2),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cash_register_totals" PRIMARY KEY ("id")
            )
        `);

        // Crear foreign key
        await queryRunner.query(`
            ALTER TABLE "cash_register_totals"
            ADD CONSTRAINT "FK_cash_register_totals_cash_register"
            FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Crear índices
        await queryRunner.query(`
            CREATE INDEX "IDX_cash_register_totals_cash_register" ON "cash_register_totals" ("cash_register_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_cash_register_totals_payment_method" ON "cash_register_totals" ("payment_method")
        `);

        // Crear índice único para evitar duplicados
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_cash_register_totals_unique" ON "cash_register_totals" ("cash_register_id", "payment_method")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índices
        await queryRunner.query(`DROP INDEX "IDX_cash_register_totals_unique"`);
        await queryRunner.query(`DROP INDEX "IDX_cash_register_totals_payment_method"`);
        await queryRunner.query(`DROP INDEX "IDX_cash_register_totals_cash_register"`);

        // Eliminar foreign key
        await queryRunner.query(`ALTER TABLE "cash_register_totals" DROP CONSTRAINT "FK_cash_register_totals_cash_register"`);

        // Eliminar tabla
        await queryRunner.query(`DROP TABLE "cash_register_totals"`);
    }
}
