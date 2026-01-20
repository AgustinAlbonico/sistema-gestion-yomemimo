/**
 * Setup para tests de integración con BD real
 */

import { DataSource } from 'typeorm';

// Entidades (importar todas)
import { User } from '../src/modules/auth/entities/user.entity';
import { RefreshToken } from '../src/modules/auth/entities/refresh-token.entity';
import { LoginAudit } from '../src/modules/auth/entities/login-audit.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { Category } from '../src/modules/products/entities/category.entity';
import { Brand } from '../src/modules/products/entities/brand.entity';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { SaleItem } from '../src/modules/sales/entities/sale-item.entity';
import { SalePayment } from '../src/modules/sales/entities/sale-payment.entity';
import { SaleTax } from '../src/modules/sales/entities/sale-tax.entity';
import { Invoice } from '../src/modules/sales/entities/invoice.entity';
import { Customer } from '../src/modules/customers/entities/customer.entity';
import { CustomerCategory } from '../src/modules/customers/entities/customer-category.entity';
import { CustomerAccount } from '../src/modules/customer-accounts/entities/customer-account.entity';
import { AccountMovement } from '../src/modules/customer-accounts/entities/account-movement.entity';
import { StockMovement } from '../src/modules/inventory/entities/stock-movement.entity';
import { PaymentMethod } from '../src/modules/configuration/entities/payment-method.entity';
import { FiscalConfiguration } from '../src/modules/configuration/entities/fiscal-configuration.entity';
import { SystemConfiguration } from '../src/modules/configuration/entities/system-configuration.entity';
import { TaxType } from '../src/modules/configuration/entities/tax-type.entity';
import { Income } from '../src/modules/incomes/entities/income.entity';
import { IncomeCategory } from '../src/modules/incomes/entities/income-category.entity';
import { Expense } from '../src/modules/expenses/entities/expense.entity';
import { ExpenseCategory } from '../src/modules/expenses/entities/expense-category.entity';
import { CashRegister } from '../src/modules/cash-register/entities/cash-register.entity';
import { CashRegisterTotals } from '../src/modules/cash-register/entities/cash-register-totals.entity';
import { CashMovement } from '../src/modules/cash-register/entities/cash-movement.entity';
import { Supplier } from '../src/modules/suppliers/entities/supplier.entity';
import { Purchase } from '../src/modules/purchases/entities/purchase.entity';
import { PurchaseItem } from '../src/modules/purchases/entities/purchase-item.entity';
import { Backup } from '../src/modules/backup/entities/backup.entity';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity';

export let testDataSource: DataSource;

beforeAll(async () => {
    testDataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5433,
        username: 'test',
        password: 'test',
        database: 'nexopos_test',
        entities: [
            User,
            RefreshToken,
            LoginAudit,
            Product,
            Category,
            Brand,
            Sale,
            SaleItem,
            SalePayment,
            SaleTax,
            Invoice,
            Customer,
            CustomerCategory,
            CustomerAccount,
            AccountMovement,
            StockMovement,
            PaymentMethod,
            FiscalConfiguration,
            SystemConfiguration,
            TaxType,
            Income,
            IncomeCategory,
            Expense,
            ExpenseCategory,
            CashRegister,
            CashRegisterTotals,
            CashMovement,
            Supplier,
            Purchase,
            PurchaseItem,
            Backup,
            AuditLog,
        ],
        // Usar synchronize para tests - TypeORM crea el esquema automáticamente desde las entidades
        synchronize: true,
        dropSchema: true,
        logging: false,
    });

    await testDataSource.initialize();
});

afterAll(async () => {
    if (testDataSource?.isInitialized) {
        await testDataSource.destroy();
    }
});

// Limpiar tablas entre tests
beforeEach(async () => {
    // Deshabilitar constraints para evitar deadlocks
    await testDataSource.query(`SET session_replication_role = 'replica'`);

    const entities = testDataSource.entityMetadatas;
    const tableNames = entities.map((e) => `"${e.tableName}"`).join(', ');

    // Truncate todas las tablas en una sola consulta
    await testDataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE`);

    // Rehabilitar constraints
    await testDataSource.query(`SET session_replication_role = 'origin'`);
});

// Helper para obtener repositorios
export const getTestRepository = <T extends object>(entity: new () => T) => {
    return testDataSource.getRepository<T>(entity);
};
