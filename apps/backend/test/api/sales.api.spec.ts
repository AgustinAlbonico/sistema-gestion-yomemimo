/**
 * Tests API - Sales Endpoints
 * Prueba los endpoints del módulo de ventas usando supertest
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/modules/auth/entities/user.entity';
import { Product } from '../../src/modules/products/entities/product.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { CustomerAccount } from '../../src/modules/customer-accounts/entities/customer-account.entity';
import { PaymentMethod } from '../../src/modules/configuration/entities/payment-method.entity';
import { CashRegister, CashRegisterStatus } from '../../src/modules/cash-register/entities/cash-register.entity';
import { CashRegisterTotals } from '../../src/modules/cash-register/entities/cash-register-totals.entity';
import { JwtService } from '@nestjs/jwt';
import { Sale, SaleStatus } from '../../src/modules/sales/entities/sale.entity';
import { SaleItem } from '../../src/modules/sales/entities/sale-item.entity';
import { SalePayment } from '../../src/modules/sales/entities/sale-payment.entity';
import { Invoice, InvoiceType, InvoiceStatus } from '../../src/modules/sales/entities/invoice.entity';

describe('API Tests - Sales Endpoints', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userRepo: Repository<User>;
    let productRepo: Repository<Product>;
    let customerRepo: Repository<Customer>;
    let accountRepo: Repository<CustomerAccount>;
    let paymentMethodRepo: Repository<PaymentMethod>;
    let cashRepo: Repository<CashRegister>;
    let totalsRepo: Repository<CashRegisterTotals>;
    let saleRepo: Repository<Sale>;
    let itemRepo: Repository<SaleItem>;
    let paymentRepo: Repository<SalePayment>;
    let invoiceRepo: Repository<Invoice>;

    let authToken: string;
    let testUserId: string;
    let testPaymentMethodId: string;

    beforeAll(async () => {
        // Crear módulo de prueba con AppModule completo
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Configurar pipes globales
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        // Obtener repositorios
        dataSource = app.get<DataSource>(DataSource);
        userRepo = dataSource.getRepository(User);
        productRepo = dataSource.getRepository(Product);
        customerRepo = dataSource.getRepository(Customer);
        accountRepo = dataSource.getRepository(CustomerAccount);
        paymentMethodRepo = dataSource.getRepository(PaymentMethod);
        cashRepo = dataSource.getRepository(CashRegister);
        totalsRepo = dataSource.getRepository(CashRegisterTotals);
        saleRepo = dataSource.getRepository(Sale);
        itemRepo = dataSource.getRepository(SaleItem);
        paymentRepo = dataSource.getRepository(SalePayment);
        invoiceRepo = dataSource.getRepository(Invoice);
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    beforeEach(async () => {
        // Limpiar tablas
        await dataSource.query('SET session_replication_role = \'replica\'');
        const tableNames = [
            'invoice', 'sale_payment', 'sale_item', 'sale',
            'cash_register_totals', 'cash_register',
            'customer_account', 'customer',
            'product', 'payment_method', 'user',
        ];
        await dataSource.query(`TRUNCATE TABLE ${tableNames.join(', ')} CASCADE`);
        await dataSource.query('SET session_replication_role = \'origin\'');

        // Crear datos de prueba
        const user = userRepo.create({
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456', // hash ficticio
            isActive: true,
        });
        const savedUser = await userRepo.save(user);
        testUserId = savedUser.id;

        const paymentMethod = paymentMethodRepo.create({
            name: 'Efectivo',
            code: 'cash',
            isActive: true,
        });
        const savedPaymentMethod = await paymentMethodRepo.save(paymentMethod);
        testPaymentMethodId = savedPaymentMethod.id;

        const cashRegister = cashRepo.create({
            date: new Date(),
            openedAt: new Date(),
            initialAmount: 1000,
            totalIncome: 0,
            totalExpense: 0,
            status: CashRegisterStatus.OPEN,
            openedById: testUserId,
        });
        await cashRepo.save(cashRegister);

        const cashTotals = totalsRepo.create({
            cashRegisterId: cashRegister.id,
            paymentMethodId: testPaymentMethodId,
            initialAmount: 1000,
            totalIncome: 0,
            totalExpense: 0,
            expectedAmount: 1000,
        });
        await totalsRepo.save(cashTotals);

        // Crear producto de prueba
        const product = productRepo.create({
            name: 'Producto Test API',
            cost: 100,
            price: 150,
            stock: 50,
            sku: 'PROD-001',
            isActive: true,
        });
        await productRepo.save(product);

        // Crear cliente de prueba
        const customer = customerRepo.create({
            firstName: 'Cliente',
            lastName: 'API Test',
            email: 'cliente@api.com',
            phone: '1199988877',
            isActive: true,
        });
        const savedCustomer = await customerRepo.save(customer);

        const account = accountRepo.create({
            customerId: savedCustomer.id,
            balance: 0,
            creditLimit: 10000,
        });
        await accountRepo.save(account);

        // Generar token JWT
        const jwtService = app.get(JwtService);
        authToken = jwtService.sign({
            sub: testUserId,
            username: 'testuser',
        });
    });

    describe('POST /sales - Crear venta', () => {
        it('debe crear una venta de contado exitosamente', async () => {
            const response = await request(app.getHttpServer())
                .post('/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    items: [
                        {
                            productId: (await productRepo.findOneBy({ sku: 'PROD-001' }))!.id,
                            quantity: 2,
                            unitPrice: 150,
                        },
                    ],
                    payments: [
                        {
                            paymentMethodId: testPaymentMethodId,
                            amount: 300,
                        },
                    ],
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.status).toBe(SaleStatus.COMPLETED);
            expect(response.body.total).toBe(300);

            // Verificar en BD
            const sale = await saleRepo.findOne({
                where: { id: response.body.id },
                relations: ['items', 'payments'],
            });
            expect(sale).toBeDefined();
            expect(sale?.items).toHaveLength(1);
            expect(sale?.payments).toHaveLength(1);
        });

        it('debe rechazar venta sin items', async () => {
            await request(app.getHttpServer())
                .post('/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    items: [],
                    payments: [
                        {
                            paymentMethodId: testPaymentMethodId,
                            amount: 100,
                        },
                    ],
                })
                .expect(400);
        });

        it('debe requerir autenticación', async () => {
            await request(app.getHttpServer())
                .post('/sales')
                .send({
                    items: [{ productId: 'any', quantity: 1, unitPrice: 100 }],
                    payments: [{ paymentMethodId: testPaymentMethodId, amount: 100 }],
                })
                .expect(401);
        });
    });

    describe('GET /sales - Listar ventas', () => {
        beforeEach(async () => {
            // Crear algunas ventas de prueba
            const product = await productRepo.findOneBy({ sku: 'PROD-001' });

            for (let i = 0; i < 3; i++) {
                const sale = saleRepo.create({
                    saleNumber: `VENTA-2026-0000${i + 1}`,
                    saleDate: new Date(),
                    subtotal: 150,
                    discount: 0,
                    surcharge: 0,
                    tax: 0,
                    total: 150,
                    status: SaleStatus.COMPLETED,
                    isOnAccount: false,
                    inventoryUpdated: true,
                    createdBy: { id: testUserId } as any,
                });
                const savedSale = await saleRepo.save(sale);

                await itemRepo.save({
                    saleId: savedSale.id,
                    productId: product!.id,
                    productCode: product!.sku,
                    productDescription: product!.name,
                    quantity: 1,
                    unitPrice: 150,
                    discount: 0,
                    discountPercent: 0,
                    subtotal: 150,
                } as any);

                await paymentRepo.save({
                    saleId: savedSale.id,
                    paymentMethodId: testPaymentMethodId,
                    amount: 150,
                    installments: null,
                } as any);
            }
        });

        it('debe listar ventas con paginación', async () => {
            const response = await request(app.getHttpServer())
                .get('/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body.data).toHaveLength(3);
            expect(response.body.total).toBe(3);
        });

        it('debe filtrar por estado', async () => {
            const response = await request(app.getHttpServer())
                .get('/sales?status=COMPLETED')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            response.body.data.forEach((sale: any) => {
                expect(sale.status).toBe(SaleStatus.COMPLETED);
            });
        });

        it('debe permitir paginación personalizada', async () => {
            const response = await request(app.getHttpServer())
                .get('/sales?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(2);
            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(2);
            expect(response.body.totalPages).toBe(2);
        });
    });

    describe('GET /sales/:id - Obtener venta por ID', () => {
        let testSaleId: string;

        beforeEach(async () => {
            const product = await productRepo.findOneBy({ sku: 'PROD-001' });

            const sale = saleRepo.create({
                saleNumber: 'VENTA-2026-00999',
                saleDate: new Date(),
                subtotal: 150,
                discount: 0,
                surcharge: 0,
                tax: 0,
                total: 150,
                status: SaleStatus.COMPLETED,
                isOnAccount: false,
                inventoryUpdated: true,
                createdBy: { id: testUserId } as any,
            });
            const savedSale = await saleRepo.save(sale);
            testSaleId = savedSale.id;

            await itemRepo.save({
                saleId: testSaleId,
                productId: product!.id,
                productCode: product!.sku,
                productDescription: product!.name,
                quantity: 1,
                unitPrice: 150,
                discount: 0,
                discountPercent: 0,
                subtotal: 150,
            } as any);
        });

        it('debe obtener venta con todas las relaciones', async () => {
            const response = await request(app.getHttpServer())
                .get(`/sales/${testSaleId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id', testSaleId);
            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('payments');
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(Array.isArray(response.body.payments)).toBe(true);
        });

        it('debe retornar 404 para venta inexistente', async () => {
            await request(app.getHttpServer())
                .get('/sales/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('GET /sales/stats - Estadísticas de ventas', () => {
        beforeEach(async () => {
            const product = await productRepo.findOneBy({ sku: 'PROD-001' });

            // Crear ventas con diferentes estados
            const completedSale = saleRepo.create({
                saleNumber: 'VENTA-2026-01001',
                saleDate: new Date(),
                subtotal: 300,
                discount: 0,
                surcharge: 0,
                tax: 0,
                total: 300,
                status: SaleStatus.COMPLETED,
                isOnAccount: false,
                inventoryUpdated: true,
                createdBy: { id: testUserId } as any,
            });
            const savedCompleted = await saleRepo.save(completedSale);

            await itemRepo.save({
                saleId: savedCompleted.id,
                productId: product!.id,
                productCode: product!.sku,
                productDescription: product!.name,
                quantity: 2,
                unitPrice: 150,
                discount: 0,
                discountPercent: 0,
                subtotal: 300,
            } as any);

            await paymentRepo.save({
                saleId: savedCompleted.id,
                paymentMethodId: testPaymentMethodId,
                amount: 300,
            } as any);

            const pendingSale = saleRepo.create({
                saleNumber: 'VENTA-2026-01002',
                saleDate: new Date(),
                subtotal: 150,
                discount: 0,
                surcharge: 0,
                tax: 0,
                total: 150,
                status: SaleStatus.PENDING,
                isOnAccount: true,
                inventoryUpdated: true,
                createdBy: { id: testUserId } as any,
            });
            await saleRepo.save(pendingSale);
        });

        it('debe retornar estadísticas correctas', async () => {
            const response = await request(app.getHttpServer())
                .get('/sales/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('totalSales');
            expect(response.body).toHaveProperty('totalAmount');
            expect(response.body).toHaveProperty('totalCompleted');
            expect(response.body).toHaveProperty('totalPending');
            expect(response.body.totalSales).toBeGreaterThanOrEqual(2);
        });
    });

    describe('PATCH /sales/:id/cancel - Cancelar venta', () => {
        let testSaleId: string;

        beforeEach(async () => {
            const product = await productRepo.findOneBy({ sku: 'PROD-001' });

            const sale = saleRepo.create({
                saleNumber: 'VENTA-2026-02000',
                saleDate: new Date(),
                subtotal: 150,
                discount: 0,
                surcharge: 0,
                tax: 0,
                total: 150,
                status: SaleStatus.COMPLETED,
                isOnAccount: false,
                inventoryUpdated: true,
                createdBy: { id: testUserId } as any,
            });
            const savedSale = await saleRepo.save(sale);
            testSaleId = savedSale.id;

            await itemRepo.save({
                saleId: testSaleId,
                productId: product!.id,
                productCode: product!.sku,
                productDescription: product!.name,
                quantity: 1,
                unitPrice: 150,
                discount: 0,
                discountPercent: 0,
                subtotal: 150,
            } as any);

            await paymentRepo.save({
                saleId: testSaleId,
                paymentMethodId: testPaymentMethodId,
                amount: 150,
            } as any);
        });

        it('debe cancelar una venta existente', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/sales/${testSaleId}/cancel`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe(SaleStatus.CANCELLED);

            // Verificar en BD
            const cancelledSale = await saleRepo.findOneBy({ id: testSaleId });
            expect(cancelledSale?.status).toBe(SaleStatus.CANCELLED);
        });

        it('debe rechazar cancelar venta ya cancelada', async () => {
            // Primera cancelación
            await request(app.getHttpServer())
                .patch(`/sales/${testSaleId}/cancel`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Segunda cancelación - debe fallar
            await request(app.getHttpServer())
                .patch(`/sales/${testSaleId}/cancel`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('Facturación - Integration con Invoice', () => {
        let testSaleId: string;

        beforeEach(async () => {
            const product = await productRepo.findOneBy({ sku: 'PROD-001' });

            const sale = saleRepo.create({
                saleNumber: 'VENTA-2026-03000',
                saleDate: new Date(),
                subtotal: 150,
                discount: 0,
                surcharge: 0,
                tax: 0,
                total: 150,
                status: SaleStatus.COMPLETED,
                isOnAccount: false,
                inventoryUpdated: true,
                createdBy: { id: testUserId } as any,
            });
            const savedSale = await saleRepo.save(sale);
            testSaleId = savedSale.id;

            await itemRepo.save({
                saleId: testSaleId,
                productId: product!.id,
                productCode: product!.sku,
                productDescription: product!.name,
                quantity: 1,
                unitPrice: 150,
                discount: 0,
                discountPercent: 0,
                subtotal: 150,
            } as any);

            await paymentRepo.save({
                saleId: testSaleId,
                paymentMethodId: testPaymentMethodId,
                amount: 150,
            } as any);
        });

        it('debe generar factura para una venta', async () => {
            // Primero creamos una factura asociada
            const invoice = invoiceRepo.create({
                saleId: testSaleId,
                invoiceType: InvoiceType.FACTURA_C,
                pointOfSale: 1,
                invoiceNumber: 1001,
                issueDate: new Date(),
                emitterCuit: '20111222233',
                emitterBusinessName: 'Test Business',
                emitterAddress: 'Test Address',
                emitterIvaCondition: 'RESPONSABLE_MONOTRIBUTO',
                emitterGrossIncome: '901-123456-1',
                receiverDocumentType: 99,
                receiverDocumentNumber: null,
                receiverName: 'Consumidor Final',
                subtotal: 150,
                discount: 0,
                otherTaxes: 0,
                total: 150,
                netAmount: 150,
                iva21: 0,
                iva105: 0,
                iva27: 0,
                netAmountExempt: 150,
                saleCondition: 'Contado',
                status: InvoiceStatus.AUTHORIZED,
                cae: '12345678901234',
                caeExpirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            });
            await invoiceRepo.save(invoice);

            const response = await request(app.getHttpServer())
                .get(`/sales/sale/${testSaleId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('invoice');
            expect(response.body.invoice).toHaveProperty('id');
            expect(response.body.invoice.status).toBe(InvoiceStatus.AUTHORIZED);
        });

        it('debe retornar null si venta no tiene factura', async () => {
            const product = await productRepo.findOneBy({ sku: 'PROD-001' });

            const saleWithoutInvoice = saleRepo.create({
                saleNumber: 'VENTA-2026-04000',
                saleDate: new Date(),
                subtotal: 150,
                discount: 0,
                surcharge: 0,
                tax: 0,
                total: 150,
                status: SaleStatus.COMPLETED,
                isOnAccount: false,
                inventoryUpdated: true,
                createdBy: { id: testUserId } as any,
            });
            const savedSale = await saleRepo.save(saleWithoutInvoice);

            const response = await request(app.getHttpServer())
                .get(`/sales/sale/${savedSale.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.invoice).toBeNull();
        });
    });
});
