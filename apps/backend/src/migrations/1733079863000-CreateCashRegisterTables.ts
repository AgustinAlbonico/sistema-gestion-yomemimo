import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCashRegisterTables1733079863000 implements MigrationInterface {
    name = 'CreateCashRegisterTables1733079863000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear tabla cash_registers
        await queryRunner.query(`
            CREATE TABLE "cash_registers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "date" date NOT NULL,
                "opened_at" TIMESTAMP NOT NULL,
                "closed_at" TIMESTAMP,
                "initial_amount" numeric(12,2) NOT NULL,
                "total_income" numeric(12,2) NOT NULL DEFAULT 0,
                "total_expense" numeric(12,2) NOT NULL DEFAULT 0,
                "expected_amount" numeric(12,2),
                "actual_amount" numeric(12,2),
                "difference" numeric(12,2),
                "status" character varying NOT NULL DEFAULT 'open',
                "opening_notes" text,
                "closing_notes" text,
                "opened_by" uuid NOT NULL,
                "closed_by" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_cash_registers" PRIMARY KEY ("id")
            )
        `);

        // Crear tabla cash_movements
        await queryRunner.query(`
            CREATE TABLE "cash_movements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cash_register_id" uuid NOT NULL,
                "movement_type" character varying NOT NULL,
                "payment_method" character varying NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "description" character varying(200) NOT NULL,
                "reference_type" character varying(50),
                "reference_id" uuid,
                "notes" text,
                "created_by" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_cash_movements" PRIMARY KEY ("id")
            )
        `);

        // Crear foreign keys
        await queryRunner.query(`
            ALTER TABLE "cash_registers"
            ADD CONSTRAINT "FK_cash_registers_opened_by"
            FOREIGN KEY ("opened_by") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cash_registers"
            ADD CONSTRAINT "FK_cash_registers_closed_by"
            FOREIGN KEY ("closed_by") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cash_movements"
            ADD CONSTRAINT "FK_cash_movements_cash_register"
            FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cash_movements"
            ADD CONSTRAINT "FK_cash_movements_created_by"
            FOREIGN KEY ("created_by") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Crear índices
        await queryRunner.query(`
            CREATE INDEX "IDX_cash_registers_date" ON "cash_registers" ("date")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_cash_registers_status" ON "cash_registers" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_cash_movements_cash_register" ON "cash_movements" ("cash_register_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_cash_movements_reference" ON "cash_movements" ("reference_type", "reference_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índices
        await queryRunner.query(`DROP INDEX "IDX_cash_movements_reference"`);
        await queryRunner.query(`DROP INDEX "IDX_cash_movements_cash_register"`);
        await queryRunner.query(`DROP INDEX "IDX_cash_registers_status"`);
        await queryRunner.query(`DROP INDEX "IDX_cash_registers_date"`);

        // Eliminar foreign keys
        await queryRunner.query(`ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_cash_movements_created_by"`);
        await queryRunner.query(`ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_cash_movements_cash_register"`);
        await queryRunner.query(`ALTER TABLE "cash_registers" DROP CONSTRAINT "FK_cash_registers_closed_by"`);
        await queryRunner.query(`ALTER TABLE "cash_registers" DROP CONSTRAINT "FK_cash_registers_opened_by"`);

        // Eliminar tablas
        await queryRunner.query(`DROP TABLE "cash_movements"`);
        await queryRunner.query(`DROP TABLE "cash_registers"`);
    }
}
