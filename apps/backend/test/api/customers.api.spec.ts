/**
 * Tests de API para Customers
 * Prueba endpoints HTTP del controlador de clientes
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { CustomerCategory } from '../../src/modules/customers/entities/customer-category.entity';
import { User } from '../../src/modules/auth/entities/user.entity';

describe('API - Customers', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let customerRepo: Repository<Customer>;
    let categoryRepo: Repository<CustomerCategory>;
    let userRepo: Repository<User>;

    let authToken: string;

    // Helpers
    const createTestCategory = async (name: string): Promise<CustomerCategory> => {
        const category = categoryRepo.create({
            name,
            description: `Categoría ${name}`,
            color: '#FF5733',
            isActive: true,
        });
        return categoryRepo.save(category);
    };

    const createTestCustomer = async (overrides: Partial<Customer> = {}): Promise<Customer> => {
        const category = await createTestCategory('Test');
        const customer = customerRepo.create({
            firstName: 'Juan',
            lastName: 'Pérez',
            documentType: 'DNI',
            ivaCondition: 'CONSUMIDOR_FINAL',
            documentNumber: '12345678',
            email: `test${Date.now()}@example.com`,
            phone: '11-1234-5678',
            mobile: '11-9876-5432',
            address: 'Calle Test 123',
            city: 'Buenos Aires',
            state: 'B',
            postalCode: '1234',
            categoryId: category.id,
            notes: 'Cliente de prueba',
            isActive: true,
            ...overrides,
        } as any);
        return customerRepo.save(customer);
    };

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
        customerRepo = dataSource.getRepository(Customer);
        categoryRepo = dataSource.getRepository(CustomerCategory);
        userRepo = dataSource.getRepository(User);

        // Crear usuario para autenticación
        const testUser = userRepo.create({
            username: 'testuser',
            email: 'testuser@example.com',
            passwordHash: 'hash',
            firstName: 'Test',
            lastName: 'User',
            isActive: true,
        } as any);
        await userRepo.save(testUser);

        // Login para obtener token
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'Test123!' });

        // Si login falla, intentar con credenciales por defecto
        if (loginResponse.status === 401) {
            // Crear usuario admin por defecto
            const adminUser = userRepo.create({
                username: 'admin',
                email: 'admin@example.com',
                passwordHash: 'hash',
                isActive: true,
            } as any);
            await userRepo.save(adminUser);

            const adminLogin = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'Admin123' });

            if (adminLogin.status === 200) {
                authToken = adminLogin.body.access_token;
            }
        } else if (loginResponse.status === 200) {
            authToken = loginResponse.body.access_token;
        }
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    beforeEach(async () => {
        // Limpiar datos antes de cada test
        await customerRepo.delete({});
        await categoryRepo.delete({});
    });

    describe('POST /customers', () => {
        it('debe crear cliente con datos válidos y retornar 201', async () => {
            const category = await createTestCategory('VIP');

            const newCustomer = {
                firstName: 'María',
                lastName: 'González',
                documentType: 'DNI',
                ivaCondition: 'CONSUMIDOR_FINAL',
                documentNumber: '20123456',
                email: 'maria.gonzalez@example.com',
                phone: '11-5555-1234',
                categoryId: category.id,
                isActive: true,
            };

            const response = await request(app.getHttpServer())
                .post('/api/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newCustomer)
                .expect(HttpStatus.CREATED);

            expect(response.body).toMatchObject({
                firstName: 'María',
                lastName: 'González',
                documentNumber: '20123456',
                email: 'maria.gonzalez@example.com',
            });
            expect(response.body.id).toBeDefined();
        });

        it('POST /customers sin auth debe retornar 401', async () => {
            const newCustomer = {
                firstName: 'María',
                lastName: 'González',
                documentNumber: '20123456',
                email: 'maria@example.com',
            };

            await request(app.getHttpServer())
                .post('/api/customers')
                .send(newCustomer)
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('POST /customers con datos inválidos debe retornar 400', async () => {
            const invalidCustomer = {
                firstName: '', // Inválido: vacío
                lastName: 'González',
                email: 'no-es-email', // Inválido: formato
            };

            const response = await request(app.getHttpServer())
                .post('/api/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidCustomer)
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.message).toBeDefined();
        });

        it('POST /customers con documento duplicado debe retornar 409', async () => {
            await createTestCustomer({ documentNumber: 'DUP-123' });

            const category = await createTestCategory('Test');
            const duplicate = {
                firstName: 'Otro',
                lastName: 'Cliente',
                documentNumber: 'DUP-123', // Duplicado
                email: 'otro@example.com',
                categoryId: category.id,
            };

            await request(app.getHttpServer())
                .post('/api/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicate)
                .expect(HttpStatus.CONFLICT);
        });

        it('POST /customers con email duplicado debe retornar 409', async () => {
            await createTestCustomer({ email: 'dup@example.com' });

            const category = await createTestCategory('Test');
            const duplicate = {
                firstName: 'Otro',
                lastName: 'Cliente',
                documentNumber: '999999',
                email: 'dup@example.com', // Duplicado
                categoryId: category.id,
            };

            await request(app.getHttpServer())
                .post('/api/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicate)
                .expect(HttpStatus.CONFLICT);
        });
    });

    describe('GET /customers', () => {
        it('GET /customers debe retornar lista paginada', async () => {
            await createTestCustomer();
            await createTestCustomer();

            const response = await request(app.getHttpServer())
                .get('/api/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(response.body.data).toBeDefined();
            expect(response.body.total).toBeDefined();
            expect(response.body.page).toBeDefined();
            expect(response.body.totalPages).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('GET /customers con filtro search debe filtrar correctamente', async () => {
            await createTestCustomer({ firstName: 'Carlos', lastName: 'López' });
            await createTestCustomer({ firstName: 'Ana', lastName: 'Martínez' });

            const response = await request(app.getHttpServer())
                .get('/api/customers?search=Carlos')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(response.body.data.length).toBeGreaterThan(0);
            expect(
                response.body.data.some((c: Customer) =>
                    c.firstName.includes('Carlos') || c.lastName.includes('Carlos')
                )
            ).toBe(true);
        });

        it('GET /customers con parámetros de ordenamiento', async () => {
            await createTestCustomer({ firstName: 'Zeta', lastName: 'Ultimo' });
            await createTestCustomer({ firstName: 'Ana', lastName: 'Primero' });

            const response = await request(app.getHttpServer())
                .get('/api/customers?sortBy=firstName&order=ASC')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            if (response.body.data.length >= 2) {
                expect(response.body.data[0].firstName).toBe('Ana');
            }
        });

        it('GET /customers sin auth debe retornar 401', async () => {
            await request(app.getHttpServer())
                .get('/api/customers')
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('GET /customers/active', () => {
        it('GET /customers/active debe retornar activos', async () => {
            await createTestCustomer({ firstName: 'Activo', isActive: true });
            await createTestCustomer({ firstName: 'Inactivo', isActive: false });

            const response = await request(app.getHttpServer())
                .get('/api/customers/active')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.every((c: Customer) => c.isActive === true)).toBe(true);
        });
    });

    describe('GET /customers/stats', () => {
        it('GET /customers/stats debe retornar estadísticas', async () => {
            await createTestCustomer({ isActive: true });
            await createTestCustomer({ isActive: true });
            await createTestCustomer({ isActive: false });

            const response = await request(app.getHttpServer())
                .get('/api/customers/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(response.body.total).toBeDefined();
            expect(response.body.active).toBeDefined();
            expect(response.body.inactive).toBeDefined();
            expect(response.body.byCategory).toBeDefined();
            expect(Array.isArray(response.body.byCategory)).toBe(true);
        });
    });

    describe('GET /customers/:id', () => {
        it('GET /customers/:id existente debe retornar cliente', async () => {
            const customer = await createTestCustomer();

            const response = await request(app.getHttpServer())
                .get(`/api/customers/${customer.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(response.body.id).toBe(customer.id);
            expect(response.body.firstName).toBeDefined();
        });

        it('GET /customers/:id inexistente debe retornar 404', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await request(app.getHttpServer())
                .get(`/api/customers/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND);
        });

        it('GET /customers/:id con UUID inválido debe retornar 400', async () => {
            await request(app.getHttpServer())
                .get('/api/customers/invalid-uuid')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('GET /customers/:id sin auth debe retornar 401', async () => {
            const customer = await createTestCustomer();

            await request(app.getHttpServer())
                .get(`/api/customers/${customer.id}`)
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('PATCH /customers/:id', () => {
        it('PATCH /customers/:id debe actualizar', async () => {
            const customer = await createTestCustomer();

            const updates = {
                firstName: 'Carlos',
                phone: '11-9999-8888',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/customers/${customer.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(HttpStatus.OK);

            expect(response.body.firstName).toBe('Carlos');
            expect(response.body.phone).toBe('11-9999-8888');
        });

        it('PATCH /customers/:id inexistente debe retornar 404', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await request(app.getHttpServer())
                .patch(fakeId)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ firstName: 'Nuevo' })
                .expect(HttpStatus.NOT_FOUND);
        });

        it('PATCH /customers/:id sin auth debe retornar 401', async () => {
            const customer = await createTestCustomer();

            await request(app.getHttpServer())
                .patch(`/api/customers/${customer.id}`)
                .send({ firstName: 'Nuevo' })
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('DELETE /customers/:id', () => {
        it('DELETE /customers/:id debe desactivar (soft delete)', async () => {
            const customer = await createTestCustomer({ isActive: true });

            await request(app.getHttpServer())
                .delete(`/api/customers/${customer.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            // Verificar que sigue existiendo pero inactivo
            const found = await customerRepo.findOne({ where: { id: customer.id } });
            expect(found).toBeDefined();
            expect(found?.isActive).toBe(false);
        });

        it('DELETE /customers/:id inexistente debe retornar 404', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await request(app.getHttpServer())
                .delete(`/api/customers/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND);
        });

        it('DELETE /customers/:id sin auth debe retornar 401', async () => {
            const customer = await createTestCustomer();

            await request(app.getHttpServer())
                .delete(`/api/customers/${customer.id}`)
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });
});
