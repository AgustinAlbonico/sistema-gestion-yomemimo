/**
 * Setup para tests de integración con BD real
 */

import { DataSource } from 'typeorm';
import { migrations } from '../src/migrations';

// Entidades (importar todas)
import { User } from '../src/modules/auth/entities/user.entity';
import { RefreshToken } from '../src/modules/auth/entities/refresh-token.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { Category } from '../src/modules/products/entities/category.entity';
import { Brand } from '../src/modules/products/entities/brand.entity';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { SaleItem } from '../src/modules/sales/entities/sale-item.entity';
import { SalePayment } from '../src/modules/sales/entities/sale-payment.entity';
import { Customer } from '../src/modules/customers/entities/customer.entity';
import { CustomerAccount } from '../src/modules/customer-accounts/entities/customer-account.entity';
import { AccountMovement } from '../src/modules/customer-accounts/entities/account-movement.entity';
import { StockMovement } from '../src/modules/inventory/entities/stock-movement.entity';
import { PaymentMethod } from '../src/modules/configuration/entities/payment-method.entity';

export let testDataSource: DataSource;

beforeAll(async () => {
    testDataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5433, // Puerto de test
        username: 'test',
        password: 'test',
        database: 'nexopos_test',
        entities: [
            User,
            RefreshToken,
            Product,
            Category,
            Brand,
            Sale,
            SaleItem,
            SalePayment,
            Customer,
            CustomerAccount,
            AccountMovement,
            StockMovement,
            PaymentMethod,
        ],
        migrations,
        synchronize: false,
        logging: false,
    });

    await testDataSource.initialize();
    await testDataSource.runMigrations();
});

afterAll(async () => {
    if (testDataSource?.isInitialized) {
        await testDataSource.destroy();
    }
});

// Limpiar tablas entre tests
beforeEach(async () => {
    const entities = testDataSource.entityMetadatas;

    for (const entity of entities) {
        const repository = testDataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }
});

// Helper para obtener repositorios
export const getTestRepository = <T>(entity: new () => T) => {
    return testDataSource.getRepository(entity);
};
