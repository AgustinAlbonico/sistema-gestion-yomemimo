import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseProfitMarginPrecision1768412960845 implements MigrationInterface {
    name = 'IncreaseProfitMarginPrecision1768412960845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_stock_movements_productId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_movements_cash_register_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_movements_created_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_accounts_paymentTermDays"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_accounts_balance"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_accounts_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_account_movements_unique_reference"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_account_movements_createdById"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_expenses_category_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_incomes_category_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_incomes_customer_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_products_brandId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_items_purchase_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_items_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_items_sale_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_items_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sale_payments_sale_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sales_date_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invoices_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invoices_sale_id"`);
        await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TYPE "public"."backups_status_enum" RENAME TO "backups_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."backups_status_enum" AS ENUM('completed', 'failed')`);
        await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" TYPE "public"."backups_status_enum" USING "status"::"text"::"public"."backups_status_enum"`);
        await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" SET DEFAULT 'completed'`);
        await queryRunner.query(`DROP TYPE "public"."backups_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_f8aad3eab194dfdae604ca11125" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "system_configuration" ALTER COLUMN "defaultProfitMargin" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "customer_categories" ADD CONSTRAINT "UQ_ede93c8cf28e307313ec668e730" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_dffea8343d90688bccac70b63ad" UNIQUE ("documentNumber")`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" DROP CONSTRAINT "FK_faa79f189b7dff19db11e5ce6e6"`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" ADD CONSTRAINT "UQ_faa79f189b7dff19db11e5ce6e6" UNIQUE ("customerId")`);
        await queryRunner.query(`ALTER TABLE "expense_categories" ADD CONSTRAINT "UQ_6bdb3db95dd955d3c701e935426" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "income_categories" ADD CONSTRAINT "UQ_9bfab959a7960a323bcf1d118cf" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "profitMargin" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "profitMargin" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "UQ_939b78561f0b4da019d2f1bdcc4" UNIQUE ("documentNumber")`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "UQ_59712045f2664aeb8a046928981" UNIQUE ("purchaseNumber")`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "UQ_12c072f5150ca7d495b07aa1c6e" UNIQUE ("saleNumber")`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_d8a00152c976a4c6a391b1eb497"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "UQ_d8a00152c976a4c6a391b1eb497" UNIQUE ("sale_id")`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" ADD CONSTRAINT "FK_faa79f189b7dff19db11e5ce6e6" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_a3acb59db67e977be45e382fc56" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_d8a00152c976a4c6a391b1eb497" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_d8a00152c976a4c6a391b1eb497"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_a3acb59db67e977be45e382fc56"`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" DROP CONSTRAINT "FK_faa79f189b7dff19db11e5ce6e6"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "UQ_d8a00152c976a4c6a391b1eb497"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_d8a00152c976a4c6a391b1eb497" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "UQ_12c072f5150ca7d495b07aa1c6e"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "UQ_59712045f2664aeb8a046928981"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "UQ_939b78561f0b4da019d2f1bdcc4"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "profitMargin" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "profitMargin" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878"`);
        await queryRunner.query(`ALTER TABLE "income_categories" DROP CONSTRAINT "UQ_9bfab959a7960a323bcf1d118cf"`);
        await queryRunner.query(`ALTER TABLE "expense_categories" DROP CONSTRAINT "UQ_6bdb3db95dd955d3c701e935426"`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" DROP CONSTRAINT "UQ_faa79f189b7dff19db11e5ce6e6"`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" ADD CONSTRAINT "FK_faa79f189b7dff19db11e5ce6e6" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_dffea8343d90688bccac70b63ad"`);
        await queryRunner.query(`ALTER TABLE "customer_categories" DROP CONSTRAINT "UQ_ede93c8cf28e307313ec668e730"`);
        await queryRunner.query(`ALTER TABLE "system_configuration" ALTER COLUMN "defaultProfitMargin" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "UQ_f8aad3eab194dfdae604ca11125"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66"`);
        await queryRunner.query(`CREATE TYPE "public"."backups_status_enum_old" AS ENUM('pending', 'completed', 'failed')`);
        await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" TYPE "public"."backups_status_enum_old" USING "status"::"text"::"public"."backups_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "backups" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."backups_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."backups_status_enum_old" RENAME TO "backups_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57"`);
        await queryRunner.query(`ALTER TABLE "brands" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_sale_id" ON "invoices" ("sale_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_status" ON "invoices" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_sales_date_status" ON "sales" ("saleDate", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_payments_sale_id" ON "sale_payments" ("sale_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_items_product_id" ON "sale_items" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sale_items_sale_id" ON "sale_items" ("sale_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_purchase_items_product_id" ON "purchase_items" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_purchase_items_purchase_id" ON "purchase_items" ("purchase_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_products_brandId" ON "products" ("brandId") `);
        await queryRunner.query(`CREATE INDEX "IDX_incomes_customer_id" ON "incomes" ("customer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_incomes_category_id" ON "incomes" ("category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_expenses_category_id" ON "expenses" ("category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_account_movements_createdById" ON "account_movements" ("createdById") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_account_movements_unique_reference" ON "account_movements" ("accountId", "referenceId", "referenceType") WHERE ("referenceId" IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_customer_accounts_status" ON "customer_accounts" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_customer_accounts_balance" ON "customer_accounts" ("balance") `);
        await queryRunner.query(`CREATE INDEX "IDX_customer_accounts_paymentTermDays" ON "customer_accounts" ("paymentTermDays") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_movements_created_by" ON "cash_movements" ("created_by") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_movements_cash_register_id" ON "cash_movements" ("cash_register_id") `);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_stock_movements_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
