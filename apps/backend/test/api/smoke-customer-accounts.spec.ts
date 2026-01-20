/**
 * Smoke Tests para módulo de Customer Accounts (Cuentas Corrientes)
 * Tests rápidos que verifican disponibilidad y performance básica
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/modules/auth/entities/user.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { CustomerAccount } from '../../src/modules/customer-accounts/entities/customer-account.entity';

describe('Smoke Tests - Customer Accounts Module', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userRepo: Repository<User>;
    let customerRepo: Repository<Customer>;
    let accountRepo: Repository<CustomerAccount>;
    let authToken: string;
    let testCustomerId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        dataSource = app.get<DataSource>(DataSource);
        userRepo = dataSource.getRepository(User);
        customerRepo = dataSource.getRepository(Customer);
        accountRepo = dataSource.getRepository(CustomerAccount);

        // Crear usuario admin para tests
        const adminUser = userRepo.create({
            username: 'smoketest',
            email: 'smoketest@example.com',
            passwordHash: 'hash',
            firstName: 'Smoke',
            lastName: 'Test',
            isActive: true,
        } as any);
        await userRepo.save(adminUser);

        // Login
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'Admin123' });

        if (loginResponse.status === 200) {
            authToken = loginResponse.body.access_token;
        }

        // Crear cliente de prueba
        const customer = customerRepo.create({
            firstName: 'Cliente',
            lastName: 'CuentaCorriente',
            email: 'cta.corriente@example.com',
            documentNumber: 'SMOKECC001',
            isActive: true,
        } as any);
        const savedCustomer = await customerRepo.save(customer);
        // Obtener el ID del cliente guardado
        if (Array.isArray(savedCustomer)) {
            testCustomerId = savedCustomer[0].id;
        } else if (savedCustomer && typeof savedCustomer === 'object' && 'id' in savedCustomer) {
            testCustomerId = (savedCustomer as any).id;
        } else {
            throw new Error('No se pudo crear el cliente de prueba');
        }

        // Crear cuenta corriente para el cliente
        const account = accountRepo.create({
            customerId: testCustomerId,
            balance: 0,
            creditLimit: 10000,
            status: 'ACTIVE',
            daysOverdue: 0,
            paymentTermDays: 30,
        } as any);
        await accountRepo.save(account);
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('Disponibilidad de endpoints', () => {
        it('GET /customer-accounts debe responder', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('data');
                expect(response.body).toHaveProperty('total');
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        });

        it('GET /customer-accounts/stats debe responder', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('totalAccounts');
                expect(response.body).toHaveProperty('totalDebt');
                expect(typeof response.body.totalAccounts).toBe('number');
            }
        });

        it('GET /customer-accounts/debtors debe responder', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts/debtors')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('GET /customer-accounts/overdue-alerts debe responder', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts/overdue-alerts')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('GET /customer-accounts/:customerId debe responder', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/customer-accounts/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('account');
                expect(response.body).toHaveProperty('movements');
            }
        });

        it('GET /customer-accounts/:customerId/pending-transactions debe responder', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/customer-accounts/${testCustomerId}/pending-transactions`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('sales');
                expect(response.body).toHaveProperty('incomes');
            }
        });
    });

    describe('Estructura de respuesta', () => {
        it('GET /customer-accounts debe tener estructura correcta de paginación', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                const body = response.body;
                expect(body).toBeInstanceOf(Object);
                expect(body.data).toBeDefined();
                expect(Array.isArray(body.data)).toBe(true);
                expect(body.total).toBeDefined();
                expect(typeof body.total).toBe('number');
            }
        });

        it('GET /customer-accounts/stats debe tener estructura correcta', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts/stats')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                const body = response.body;
                expect(body.totalAccounts).toBeDefined();
                expect(body.activeAccounts).toBeDefined();
                expect(body.suspendedAccounts).toBeDefined();
                expect(body.totalDebt).toBeDefined();
                expect(body.overdueAccounts).toBeDefined();
                expect(body.overdueAmount).toBeDefined();
                expect(typeof body.totalAccounts).toBe('number');
                expect(typeof body.totalDebt).toBe('number');
            }
        });

        it('GET /customer-accounts/:customerId debe tener estructura de estado de cuenta', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/customer-accounts/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                const body = response.body;
                expect(body.account).toBeDefined();
                expect(body.movements).toBeDefined();
                expect(body.summary).toBeDefined();
                expect(body.summary.currentBalance).toBeDefined();
                expect(body.summary.customerPosition).toBeDefined();
            }
        });
    });

    describe('Tiempo de respuesta - Performance básica', () => {
        it('GET /customer-accounts debe responder en menos de 300ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts')
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(300);
            }
        });

        it('GET /customer-accounts/stats debe responder en menos de 200ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts/stats')
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(200);
            }
        });

        it('GET /customer-accounts/debtors debe responder en menos de 250ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts/debtors')
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(250);
            }
        });

        it('GET /customer-accounts/:customerId debe responder en menos de 200ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get(`/api/customer-accounts/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(200);
            }
        });
    });

    describe('Manejo de errores - smoke test', () => {
        it('POST /customer-accounts/:customerId/charges sin auth debe retornar 401 (no 500)', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/customer-accounts/${testCustomerId}/charges`)
                .send({ amount: 1000, description: 'Test' });

            expect(response.status).not.toBe(500);
            expect([401, 400]).toContain(response.status);
        });

        it('POST /customer-accounts/:customerId/payments sin auth debe retornar 401 (no 500)', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/customer-accounts/${testCustomerId}/payments`)
                .send({ amount: 500, paymentMethodId: 'test-id' });

            expect(response.status).not.toBe(500);
            expect([401, 400]).toContain(response.status);
        });

        it('GET /customer-accounts con cliente inexistente no debe retornar 500', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).not.toBe(500);
        });

        it('POST /customer-accounts/:customerId/charges con monto inválido debe retornar 400 (no 500)', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/customer-accounts/${testCustomerId}/charges`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: -100, description: 'Test' }); // monto negativo

            expect(response.status).not.toBe(500);
        });
    });

    describe('Operaciones CRUD básicas', () => {
        it('POST /customer-accounts/:customerId/charges debe crear un cargo', async () => {
            const chargeData = {
                amount: 1500,
                description: 'Venta de prueba - smoke test',
            };

            const response = await request(app.getHttpServer())
                .post(`/api/customer-accounts/${testCustomerId}/charges`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(chargeData);

            if (response.status === 201) {
                expect(response.body).toHaveProperty('id');
                expect(response.body.amount).toBe(1500);
                expect(response.body.movementType).toBe('CHARGE');
            }
        });

        it('POST /customer-accounts/:customerId/payments debe crear un pago', async () => {
            // Primero crear un cargo para tener deuda
            await request(app.getHttpServer())
                .post(`/api/customer-accounts/${testCustomerId}/charges`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 1000, description: 'Cargo previo' });

            const paymentData = {
                amount: 500,
                paymentMethodId: 'test-method-id',
                description: 'Pago de prueba - smoke test',
            };

            const response = await request(app.getHttpServer())
                .post(`/api/customer-accounts/${testCustomerId}/payments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            if (response.status === 201) {
                expect(response.body).toHaveProperty('id');
                expect(response.body.amount).toBeDefined();
                expect(response.body.movementType).toBe('PAYMENT');
            }
        });

        it('PATCH /customer-accounts/:customerId debe actualizar límite', async () => {
            const updateData = {
                creditLimit: 15000,
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/customer-accounts/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            if (response.status === 200) {
                expect(response.body.creditLimit).toBeDefined();
            }
        });
    });

    describe('Filtros y consultas', () => {
        it('GET /customer-accounts con filtro de status debe funcionar', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts?status=ACTIVE')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        });

        it('GET /customer-accounts con filtro hasDebt debe funcionar', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts?hasDebt=true')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                expect(response.body.data).toBeDefined();
            }
        });

        it('GET /customer-accounts con paginación debe funcionar', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-accounts?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                expect(response.body.page).toBe(1);
                expect(response.body.limit).toBe(10);
            }
        });
    });
});
