/**
 * Tests de API para CustomerCategories
 * Prueba endpoints HTTP del controlador de categorías
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { CustomerCategory } from '../../src/modules/customers/entities/customer-category.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { User } from '../../src/modules/auth/entities/user.entity';

describe('API - CustomerCategories', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let categoryRepo: Repository<CustomerCategory>;
    let customerRepo: Repository<Customer>;
    let userRepo: Repository<User>;

    let authToken: string;

    const createTestCategory = async (name: string): Promise<CustomerCategory> => {
        const category = categoryRepo.create({
            name,
            description: `Categoría ${name}`,
            color: '#FF5733',
            isActive: true,
        });
        return categoryRepo.save(category);
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
        categoryRepo = dataSource.getRepository(CustomerCategory);
        customerRepo = dataSource.getRepository(Customer);
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

    beforeEach(async () => {
        // Limpiar datos antes de cada test
        await customerRepo.delete({});
        await categoryRepo.delete({});
    });

    describe('POST /customer-categories', () => {
        it('POST /customer-categories debe crear con 201', async () => {
            const newCategory = {
                name: 'VIP',
                description: 'Clientes VIP',
                color: '#FF5733',
                isActive: true,
            };

            const response = await request(app.getHttpServer())
                .post('/api/customer-categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newCategory)
                .expect(HttpStatus.CREATED);

            expect(response.body.name).toBe('VIP');
            expect(response.body.description).toBe('Clientes VIP');
            expect(response.body.color).toBe('#FF5733');
            expect(response.body.id).toBeDefined();
        });

        it('POST /customer-categories sin auth debe retornar 401', async () => {
            const newCategory = { name: 'Test' };

            await request(app.getHttpServer())
                .post('/api/customer-categories')
                .send(newCategory)
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('POST /customer-categories con nombre duplicado debe retornar 409', async () => {
            await createTestCategory('Duplicado');

            const duplicate = { name: 'Duplicado' };

            await request(app.getHttpServer())
                .post('/api/customer-categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicate)
                .expect(HttpStatus.CONFLICT);
        });

        it('POST /customer-categories con datos inválidos debe retornar 400', async () => {
            const invalid = { name: '' }; // Vacío es inválido

            await request(app.getHttpServer())
                .post('/api/customer-categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalid)
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('POST /customer-categories debe generar color si no se proporciona', async () => {
            const newCategory = { name: 'TestColor' };

            const response = await request(app.getHttpServer())
                .post('/api/customer-categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newCategory)
                .expect(HttpStatus.CREATED);

            expect(response.body.color).toBeDefined();
            expect(response.body.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });

    describe('GET /customer-categories', () => {
        it('GET /customer-categories debe listar todas', async () => {
            await createTestCategory('Zeta');
            await createTestCategory('Alfa');

            const response = await request(app.getHttpServer())
                .get('/api/customer-categories')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
        });

        it('GET /customer-categories sin auth debe retornar 401', async () => {
            await request(app.getHttpServer())
                .get('/api/customer-categories')
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('GET /customer-categories/active', () => {
        it('GET /customer-categories/active debe listar solo activas', async () => {
            await createTestCategory('Activa');
            await categoryRepo.save(
                categoryRepo.create({ name: 'Inactiva', isActive: true })
            );
            const inactiva = await categoryRepo.findOne({ where: { name: 'Inactiva' } });
            if (inactiva) {
                inactiva.isActive = false;
                await categoryRepo.save(inactiva);
            }

            const response = await request(app.getHttpServer())
                .get('/api/customer-categories/active')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.every((c: CustomerCategory) => c.isActive === true)).toBe(true);
        });
    });

    describe('GET /customer-categories/:id', () => {
        it('GET /customer-categories/:id existente debe retornar categoría', async () => {
            const category = await createTestCategory('Buscar');

            const response = await request(app.getHttpServer())
                .get(`/api/customer-categories/${category.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(response.body.id).toBe(category.id);
            expect(response.body.name).toBe('Buscar');
        });

        it('GET /customer-categories/:id inexistente debe retornar 404', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await request(app.getHttpServer())
                .get(`/api/customer-categories/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND);
        });

        it('GET /customer-categories/:id con UUID inválido debe retornar 400', async () => {
            await request(app.getHttpServer())
                .get('/api/customer-categories/invalid-uuid')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.BAD_REQUEST);
        });
    });

    describe('PATCH /customer-categories/:id', () => {
        it('PATCH /customer-categories/:id debe actualizar', async () => {
            const category = await createTestCategory('Original');

            const updates = {
                name: 'Actualizada',
                description: 'Nueva descripción',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/customer-categories/${category.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(HttpStatus.OK);

            expect(response.body.name).toBe('Actualizada');
            expect(response.body.description).toBe('Nueva descripción');
        });

        it('PATCH /customer-categories/:id con nombre duplicado debe retornar 409', async () => {
            await createTestCategory('Existente');
            const toUpdate = await createTestCategory('Actualizar');

            const updates = { name: 'Existente' }; // Duplicado

            await request(app.getHttpServer())
                .patch(`/api/customer-categories/${toUpdate.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(HttpStatus.CONFLICT);
        });

        it('PATCH /customer-categories/:id inexistente debe retornar 404', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await request(app.getHttpServer())
                .patch(`/api/customer-categories/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Nuevo' })
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('DELETE /customer-categories/:id', () => {
        it('DELETE /customer-categories/:id debe eliminar sin clientes', async () => {
            const category = await createTestCategory('Eliminar');

            await request(app.getHttpServer())
                .delete(`/api/customer-categories/${category.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            const found = await categoryRepo.findOne({ where: { id: category.id } });
            expect(found).toBeNull();
        });

        it('DELETE /customer-categories/:id con clientes debe retornar 409', async () => {
            const category = await createTestCategory('ConClientes');

            // Crear cliente asociado
            const customer = customerRepo.create({
                firstName: 'Juan',
                lastName: 'Pérez',
                documentNumber: '12345678',
                email: 'juan@example.com',
                categoryId: category.id,
                isActive: true,
            } as any);
            await customerRepo.save(customer);

            await request(app.getHttpServer())
                .delete(`/api/customer-categories/${category.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.CONFLICT);
        });

        it('DELETE /customer-categories/:id inexistente debe retornar 404', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await request(app.getHttpServer())
                .delete(`/api/customer-categories/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.NOT_FOUND);
        });
    });
});
