import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración para estandarizar la precisión numérica en todo el esquema.
 * Cambia columnas numeric(10,2) y numeric(12,2) a numeric(20,2) para mayor capacidad.
 * Esta versión es idempotente y segura.
 */
export class MassiveNumericPrecisionStandardization1768413296219 implements MigrationInterface {
    name = 'MassiveNumericPrecisionStandardization1768413296219'

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

    /**
     * Altera el tipo de una columna si existe
     */
    private async alterColumnTypeIfExists(
        queryRunner: QueryRunner,
        tableName: string,
        columnName: string,
        newType: string
    ): Promise<void> {
        if (await this.columnExists(queryRunner, tableName, columnName)) {
            try {
                await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newType}`);
            } catch (error) {
                // Si el tipo ya es el mismo, PostgreSQL no da error, pero por si acaso
                const err = error as { message?: string };
                if (!err.message?.includes('already') && !err.message?.includes('same')) {
                    throw error;
                }
            }
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ============================================
        // CASH_REGISTER_TOTALS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'initialAmount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'totalIncome', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'totalExpense', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'expectedAmount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'actualAmount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'difference', 'numeric(20,2)');

        // ============================================
        // CASH_REGISTERS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'initialAmount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'totalIncome', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'totalExpense', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'expectedAmount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'actualAmount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'difference', 'numeric(20,2)');

        // ============================================
        // CASH_MOVEMENTS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'cash_movements', 'manualAmount', 'numeric(20,2)');

        // ============================================
        // TAX_TYPES - Cambiar percentage a numeric(10,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'tax_types', 'percentage', 'numeric(10,2)');

        // ============================================
        // CUSTOMER_ACCOUNTS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'customer_accounts', 'balance', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'customer_accounts', 'creditLimit', 'numeric(20,2)');

        // ============================================
        // ACCOUNT_MOVEMENTS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'account_movements', 'amount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'account_movements', 'balanceBefore', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'account_movements', 'balanceAfter', 'numeric(20,2)');

        // ============================================
        // EXPENSES & INCOMES - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'expenses', 'amount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'incomes', 'amount', 'numeric(20,2)');

        // ============================================
        // PRODUCTS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'products', 'cost', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'products', 'price', 'numeric(20,2)');

        // ============================================
        // STOCK_MOVEMENTS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'stock_movements', 'cost', 'numeric(20,2)');

        // ============================================
        // PURCHASES - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'subtotal', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'tax', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'discount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'total', 'numeric(20,2)');

        // ============================================
        // PURCHASE_ITEMS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'purchase_items', 'unitPrice', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchase_items', 'subtotal', 'numeric(20,2)');

        // ============================================
        // SALE_ITEMS - Cambiar a numeric(20,2) y numeric(10,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'unitPrice', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'discount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'discountPercent', 'numeric(10,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'subtotal', 'numeric(20,2)');

        // ============================================
        // SALE_PAYMENTS - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'sale_payments', 'amount', 'numeric(20,2)');

        // ============================================
        // SALE_TAXES - Cambiar a numeric(20,2) y numeric(10,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'sale_taxes', 'percentage', 'numeric(10,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_taxes', 'amount', 'numeric(20,2)');

        // ============================================
        // SALES - Cambiar a numeric(20,2) y numeric(10,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'subtotal', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'discount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'surcharge', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'tax', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'total', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'ivaPercentage', 'numeric(10,2)');

        // ============================================
        // INVOICES - Cambiar a numeric(20,2)
        // ============================================
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'subtotal', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'discount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'otherTaxes', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'total', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'netAmount', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'iva21', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'iva105', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'iva27', 'numeric(20,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'netAmountExempt', 'numeric(20,2)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir cambios (generalmente no se recomienda, pero aquí está para completitud)
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'netAmountExempt', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'iva27', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'iva105', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'iva21', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'netAmount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'total', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'otherTaxes', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'discount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'invoices', 'subtotal', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'ivaPercentage', 'numeric(4,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'total', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'tax', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'surcharge', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'discount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sales', 'subtotal', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'sale_taxes', 'amount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_taxes', 'percentage', 'numeric(5,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'sale_payments', 'amount', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'subtotal', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'discountPercent', 'numeric(5,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'discount', 'numeric(10,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'sale_items', 'unitPrice', 'numeric(10,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'purchase_items', 'subtotal', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchase_items', 'unitPrice', 'numeric(10,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'total', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'discount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'tax', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'purchases', 'subtotal', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'stock_movements', 'cost', 'numeric(10,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'products', 'price', 'numeric(10,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'products', 'cost', 'numeric(10,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'incomes', 'amount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'expenses', 'amount', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'account_movements', 'balanceAfter', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'account_movements', 'balanceBefore', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'account_movements', 'amount', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'customer_accounts', 'creditLimit', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'customer_accounts', 'balance', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'tax_types', 'percentage', 'numeric(5,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'cash_movements', 'manualAmount', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'difference', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'actualAmount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'expectedAmount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'totalExpense', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'totalIncome', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_registers', 'initialAmount', 'numeric(12,2)');

        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'difference', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'actualAmount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'expectedAmount', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'totalExpense', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'totalIncome', 'numeric(12,2)');
        await this.alterColumnTypeIfExists(queryRunner, 'cash_register_totals', 'initialAmount', 'numeric(12,2)');
    }
}
