import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Category } from '../modules/products/entities/category.entity';
import { Product } from '../modules/products/entities/product.entity';
import { SystemConfiguration } from '../modules/configuration/entities/system-configuration.entity';
import { TaxType } from '../modules/configuration/entities/tax-type.entity';
import { CustomerCategory } from '../modules/customers/entities/customer-category.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { ExpenseCategory } from '../modules/expenses/entities/expense-category.entity';
import { Expense } from '../modules/expenses/entities/expense.entity';
import { PaymentMethod as PaymentMethodEntity } from '../modules/configuration/entities/payment-method.entity';
import { Supplier } from '../modules/suppliers/entities/supplier.entity';
import { Purchase } from '../modules/purchases/entities/purchase.entity';
import { PurchaseItem } from '../modules/purchases/entities/purchase-item.entity';
import { Sale } from '../modules/sales/entities/sale.entity';
import { SaleItem } from '../modules/sales/entities/sale-item.entity';
import { SalePayment } from '../modules/sales/entities/sale-payment.entity';
import { SaleTax } from '../modules/sales/entities/sale-tax.entity';
import { CashRegister } from '../modules/cash-register/entities/cash-register.entity';
import { CashRegisterTotals } from '../modules/cash-register/entities/cash-register-totals.entity';
import { CashMovement } from '../modules/cash-register/entities/cash-movement.entity';
import { Invoice } from '../modules/sales/entities/invoice.entity';
import { StockMovement } from '../modules/inventory/entities/stock-movement.entity';
import { FiscalConfiguration } from '../modules/configuration/entities/fiscal-configuration.entity';
import { CustomerAccount } from '../modules/customer-accounts/entities/customer-account.entity';
import { AccountMovement } from '../modules/customer-accounts/entities/account-movement.entity';
import { CreateCashRegisterTables1733079863000 } from '../migrations/1733079863000-CreateCashRegisterTables';
import { CreateCashRegisterTotals1733100000000 } from '../migrations/1733100000000-CreateCashRegisterTotals';
import { AddStockMovementSource1733100001000 } from '../migrations/1733100001000-AddStockMovementSource';
import { CreateCustomerAccountsTables1733535600000 } from '../migrations/1733535600000-CreateCustomerAccountsTables';
import { SeparateWsaaTokensByEnvironment1733866700000 } from '../migrations/1733866700000-SeparateWsaaTokensByEnvironment';
import { CategoryProfitMarginAndManyToOne1733877600000 } from '../migrations/1733877600000-CategoryProfitMarginAndManyToOne';
import { RemoveExpenseCategoryFields1734095590000 } from '../migrations/1734095590000-RemoveExpenseCategoryFields';
import { AddDescriptionToProducts1734110000000 } from '../migrations/1734110000000-AddDescriptionToProducts';
import { AddSistemaHabilitado1734310000000 } from '../migrations/1734310000000-AddSistemaHabilitado';

// Cargar variables de entorno
config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'nexopos',
    entities: [
        User,
        RefreshToken,
        Category,
        Product,
        SystemConfiguration,
        TaxType,
        CustomerCategory,
        Customer,
        ExpenseCategory,
        Expense,
        PaymentMethodEntity,
        Supplier,
        Purchase,
        PurchaseItem,
        Sale,
        SaleItem,
        SalePayment,
        SaleTax,
        CashRegister,
        CashRegisterTotals,
        CashMovement,
        Invoice,
        StockMovement,
        FiscalConfiguration,
        CustomerAccount,
        AccountMovement,
    ],
    migrations: [
        CreateCashRegisterTables1733079863000,
        CreateCashRegisterTotals1733100000000,
        AddStockMovementSource1733100001000,
        CreateCustomerAccountsTables1733535600000,
        SeparateWsaaTokensByEnvironment1733866700000,
        CategoryProfitMarginAndManyToOne1733877600000,
        RemoveExpenseCategoryFields1734095590000,
        AddDescriptionToProducts1734110000000,
        AddSistemaHabilitado1734310000000,
    ],
    synchronize: false,
    logging: true,
});

(async () => {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await dataSource.initialize();

        console.log('✅ Conexión establecida');

        // Mostrar migraciones ejecutadas
        const executedMigrations = await dataSource.showMigrations();
        if (!executedMigrations) {
            console.log('📋 Migraciones ya ejecutadas');
        }

        console.log('🚀 Ejecutando migraciones pendientes...\n');

        const migrations = await dataSource.runMigrations({ transaction: 'all' });

        if (migrations.length === 0) {
            console.log('✨ No hay migraciones pendientes');
        } else {
            console.log(`\n✅ ${migrations.length} migración(es) ejecutada(s) exitosamente:`);
            migrations.forEach(migration => {
                console.log(`   - ${migration.name}`);
            });
        }

        console.log('\n🎉 Proceso completado');
        process.exitCode = 0;

    } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
        process.exitCode = 1;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
})();
