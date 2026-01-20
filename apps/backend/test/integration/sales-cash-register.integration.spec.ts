/**
 * Integración: venta + caja + stock
 */
import { testDataSource } from '../setup-integration';
import { Sale } from '../../src/modules/sales/entities/sale.entity';
import { SaleItem } from '../../src/modules/sales/entities/sale-item.entity';
import { SalePayment } from '../../src/modules/sales/entities/sale-payment.entity';
import { Product } from '../../src/modules/products/entities/product.entity';
import { CashRegister, CashRegisterStatus } from '../../src/modules/cash-register/entities/cash-register.entity';
import { CashRegisterTotals } from '../../src/modules/cash-register/entities/cash-register-totals.entity';
import { PaymentMethod } from '../../src/modules/configuration/entities/payment-method.entity';
import { User } from '../../src/modules/auth/entities/user.entity';
import { SaleStatus } from '../../src/modules/sales/entities/sale.entity';

const seedUser = async (): Promise<User> => {
    const repo = testDataSource.getRepository(User);
    return repo.save(repo.create({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashedpassword',
        isActive: true,
    }));
};

const seedPaymentMethod = async (): Promise<PaymentMethod> => {
    const repo = testDataSource.getRepository(PaymentMethod);
    const method = repo.create({ name: 'Efectivo', code: 'cash', isActive: true });
    return repo.save(method);
};

describe('Integración ventas + caja', () => {
    it('crea venta y actualiza caja y stock', async () => {
        const productRepo = testDataSource.getRepository(Product);
        const paymentRepo = testDataSource.getRepository(SalePayment);
        const saleRepo = testDataSource.getRepository(Sale);
        const cashRepo = testDataSource.getRepository(CashRegister);
        const totalsRepo = testDataSource.getRepository(CashRegisterTotals);

        const user = await seedUser();
        const paymentMethod = await seedPaymentMethod();
        const product = await productRepo.save(
            productRepo.create({ name: 'Prod', cost: 100, price: 150, stock: 10, isActive: true }),
        );

        const cashRegisterEntity = cashRepo.create({
            date: new Date(),
            openedAt: new Date(),
            initialAmount: 1000,
            totalIncome: 0,
            totalExpense: 0,
            status: CashRegisterStatus.OPEN,
            openedById: user.id,
        });
        const cashRegister = await cashRepo.save(cashRegisterEntity);

        const cashTotalsEntity = totalsRepo.create({
            cashRegisterId: cashRegister.id,
            paymentMethodId: paymentMethod.id,
            initialAmount: 1000,
            totalIncome: 0,
            totalExpense: 0,
            expectedAmount: 1000,
        });
        await totalsRepo.save(cashTotalsEntity);

        const saleEntity = saleRepo.create({
            saleNumber: 'VENTA-2026-00001',
            saleDate: new Date(),
            subtotal: 150,
            discount: 0,
            surcharge: 0,
            tax: 0,
            total: 150,
            status: SaleStatus.COMPLETED,
            isOnAccount: false,
            inventoryUpdated: true,
        });
        const sale = await saleRepo.save(saleEntity);

        await testDataSource.getRepository(SaleItem).save(
            testDataSource.getRepository(SaleItem).create({
                saleId: sale.id,
                productId: product.id,
                productCode: 'SKU',
                productDescription: product.name,
                quantity: 1,
                unitPrice: 150,
                discount: 0,
                discountPercent: 0,
                subtotal: 150,
            }),
        );

        await paymentRepo.save(
            paymentRepo.create({
                saleId: sale.id,
                paymentMethodId: paymentMethod.id,
                amount: 150,
                installments: null,
                cardLastFourDigits: null,
                authorizationCode: null,
                referenceNumber: null,
                notes: null,
            }),
        );

        const updatedProduct = await productRepo.findOneBy({ id: product.id });
        const updatedRegister = await cashRepo.findOneBy({ id: cashRegister.id });

        expect(updatedProduct?.stock).toBe(10);
        expect(updatedRegister?.status).toBe(CashRegisterStatus.OPEN);
    });
});
