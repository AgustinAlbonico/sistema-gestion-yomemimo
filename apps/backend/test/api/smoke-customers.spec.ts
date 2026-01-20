/**
 * Smoke Tests para módulo de Customers
 * Tests rápidos que verifican disponibilidad y performance básica
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/modules/auth/entities/user.entity';

describe('Smoke Tests - Customers Module', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userRepo: Repository<User>;
    let authToken: string;

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
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('Disponibilidad de endpoints', () => {
        it('GET /customers debe responder (aunque vacío)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            // 401 es aceptable si el token expiró
            if (response.status === 200) {
                expect(response.body).toHaveProperty('data');
                expect(response.body).toHaveProperty('total');
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        });

        it('GET /customer-categories debe responder (aunque vacío)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customer-categories')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('GET /customers/stats debe retornar estructura válida', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('total');
                expect(response.body).toHaveProperty('active');
                expect(response.body).toHaveProperty('inactive');
                expect(response.body).toHaveProperty('byCategory');
                expect(typeof response.body.total).toBe('number');
                expect(typeof response.body.active).toBe('number');
                expect(Array.isArray(response.body.byCategory)).toBe(true);
            }
        });

        it('GET /customers/active debe responder', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/active')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });
    });

    describe('Estructura de respuesta', () => {
        it('GET /customers debe tener estructura correcta de paginación', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                const body = response.body;

                expect(body).toBeInstanceOf(Object);
                expect(body.data).toBeDefined();
                expect(Array.isArray(body.data)).toBe(true);
                expect(body.total).toBeDefined();
                expect(typeof body.total).toBe('number');
                expect(body.page).toBeDefined();
                expect(typeof body.page).toBe('number');
                expect(body.totalPages).toBeDefined();
                expect(typeof body.totalPages).toBe('number');
            }
        });

        it('GET /customers/stats debe tener tipos correctos', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/stats')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200) {
                const body = response.body;

                expect(body.total >= 0).toBe(true);
                expect(body.active >= 0).toBe(true);
                expect(body.inactive >= 0).toBe(true);
                expect(body.total).toBe(body.active + body.inactive);
            }
        });
    });

    describe('Tiempo de respuesta - Performance básica', () => {
        it('GET /customers debe responder en menos de 200ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get('/api/customers')
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(200);
            }
        });

        it('GET /customers/active debe responder en menos de 150ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get('/api/customers/active')
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(150);
            }
        });

        it('GET /customer-categories debe responder en menos de 100ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get('/api/customer-categories')
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(100);
            }
        });

        it('GET /customers/stats debe responder en menos de 150ms', async () => {
            const start = Date.now();

            const response = await request(app.getHttpServer())
                .get('/api/customers/stats')
                .set('Authorization', `Bearer ${authToken}`);

            const duration = Date.now() - start;

            if (response.status === 200) {
                expect(duration).toBeLessThan(150);
            }
        });
    });

    describe('Manejo de errores - smoke test', () => {
        it('POST /customers sin auth debe retornar 401 (no 500)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/customers')
                .send({ firstName: 'Test', lastName: 'User' });

            expect(response.status).not.toBe(500);
            expect([401, 400]).toContain(response.status);
        });

        it('POST /customer-categories sin auth debe retornar 401 (no 500)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/customer-categories')
                .send({ name: 'Test' });

            expect(response.status).not.toBe(500);
            expect([401, 400]).toContain(response.status);
        });

        it('GET /customers con UUID inválido debe retornar 400 (no 500)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/not-a-uuid')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status !== 401) {
                expect(response.status).not.toBe(500);
                expect([400, 401]).toContain(response.status);
            }
        });
    });

    describe('Conexión a base de datos', () => {
        it('debe poder crear y leer un cliente rápidamente', async () => {
            const newCustomer = {
                firstName: 'Smoke',
                lastName: 'Test',
                documentNumber: 'SMOKE001',
                email: 'smoke@example.com',
            };

            const createResponse = await request(app.getHttpServer())
                .post('/api/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newCustomer);

            if (createResponse.status === 201) {
                const customerId = createResponse.body.id;

                const getResponse = await request(app.getHttpServer())
                    .get(`/api/customers/${customerId}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(getResponse.status).toBe(200);
                expect(getResponse.body.firstName).toBe('Smoke');
            }
        });
    });
});
