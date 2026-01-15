import { MigrationInterface, QueryRunner } from "typeorm";

export class MassiveNumericPrecisionStandardization1768413296219 implements MigrationInterface {
    name = 'MassiveNumericPrecisionStandardization1768413296219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "initialAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "totalIncome" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "totalExpense" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "expectedAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "actualAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "difference" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "initialAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "totalIncome" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "totalExpense" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "expectedAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "actualAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "difference" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "cash_movements" ALTER COLUMN "manualAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "tax_types" ALTER COLUMN "percentage" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" ALTER COLUMN "balance" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" ALTER COLUMN "creditLimit" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "account_movements" ALTER COLUMN "amount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "account_movements" ALTER COLUMN "balanceBefore" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "account_movements" ALTER COLUMN "balanceAfter" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "amount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "incomes" ALTER COLUMN "amount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "cost" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "price" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ALTER COLUMN "cost" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "subtotal" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "tax" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "discount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "total" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "purchase_items" ALTER COLUMN "unitPrice" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "purchase_items" ALTER COLUMN "subtotal" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "unitPrice" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "discount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "discountPercent" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "subtotal" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sale_payments" ALTER COLUMN "amount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sale_taxes" ALTER COLUMN "percentage" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "sale_taxes" ALTER COLUMN "amount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "subtotal" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "discount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "surcharge" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "tax" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "total" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "ivaPercentage" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "subtotal" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "discount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "otherTaxes" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "total" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "netAmount" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "iva21" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "iva105" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "iva27" TYPE numeric(20,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "netAmountExempt" TYPE numeric(20,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "netAmountExempt" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "iva27" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "iva105" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "iva21" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "netAmount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "total" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "otherTaxes" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "discount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "subtotal" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "ivaPercentage" TYPE numeric(4,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "total" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "tax" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "surcharge" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "discount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "subtotal" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sale_taxes" ALTER COLUMN "amount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sale_taxes" ALTER COLUMN "percentage" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "sale_payments" ALTER COLUMN "amount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "subtotal" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "discountPercent" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "discount" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "unitPrice" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "purchase_items" ALTER COLUMN "subtotal" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "purchase_items" ALTER COLUMN "unitPrice" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "total" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "discount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "tax" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "subtotal" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ALTER COLUMN "cost" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "price" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "cost" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "incomes" ALTER COLUMN "amount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "amount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "account_movements" ALTER COLUMN "balanceAfter" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "account_movements" ALTER COLUMN "balanceBefore" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "account_movements" ALTER COLUMN "amount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" ALTER COLUMN "creditLimit" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "customer_accounts" ALTER COLUMN "balance" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "tax_types" ALTER COLUMN "percentage" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "cash_movements" ALTER COLUMN "manualAmount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "difference" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "actualAmount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "expectedAmount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "totalExpense" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "totalIncome" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_registers" ALTER COLUMN "initialAmount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "difference" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "actualAmount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "expectedAmount" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "totalExpense" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "totalIncome" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "cash_register_totals" ALTER COLUMN "initialAmount" TYPE numeric(12,2)`);
    }

}
