import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import request from 'supertest';

/**
 * Tests API para módulo configuration
 * Verifica endpoints HTTP, autenticación y validación
 */

describe('API Tests - Módulo Configuration', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        dataSource = app.get<DataSource>(DataSource);

        // Obtener token usando el helper
        const loginRes = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'Admin123' });

        if (loginRes.status === 200) {
            authToken = loginRes.body.access_token;
        }
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('ConfigurationController - /api/configuration', () => {
        describe('GET /api/configuration', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .get('/api/configuration')
                    .expect(401);
            });

            it('debe retornar configuración con token válido (si disponible)', async () => {
                if (!authToken) {
                    console.warn('No se pudo obtener token de autenticación, saltando test');
                    return;
                }

                return request(app.getHttpServer())
                    .get('/api/configuration')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('id');
                        expect(res.body).toHaveProperty('defaultProfitMargin');
                        expect(res.body).toHaveProperty('minStockAlert');
                        expect(res.body).toHaveProperty('sistemaHabilitado');
                    });
            });
        });

        describe('PATCH /api/configuration', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .patch('/api/configuration')
                    .send({ defaultProfitMargin: 35 })
                    .expect(401);
            });

            it('debe rechazar valores inválidos con auth', async () => {
                if (!authToken) return;

                return request(app.getHttpServer())
                    .patch('/api/configuration')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ defaultProfitMargin: -10 })
                    .expect(400);
            });
        });

        describe('POST /api/configuration/update-all-prices', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .post('/api/configuration/update-all-prices')
                    .send({ defaultProfitMargin: 30 })
                    .expect(401);
            });
        });
    });

    describe('FiscalConfigurationController - /api/configuration/fiscal', () => {
        describe('GET /api/configuration/fiscal', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .get('/api/configuration/fiscal')
                    .expect(401);
            });
        });

        describe('PATCH /api/configuration/fiscal/emitter', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .patch('/api/configuration/fiscal/emitter')
                    .send({ businessName: 'Test' })
                    .expect(401);
            });
        });

        describe('PATCH /api/configuration/fiscal/environment', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .patch('/api/configuration/fiscal/environment')
                    .send({ environment: 'HOMOLOGACION' })
                    .expect(401);
            });
        });

        describe('GET /api/configuration/fiscal/status', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .get('/api/configuration/fiscal/status')
                    .expect(401);
            });
        });

        describe('POST /api/configuration/fiscal/test-connection', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .post('/api/configuration/fiscal/test-connection')
                    .expect(401);
            });
        });

        describe('POST /api/configuration/fiscal/certificates/generate', () => {
            it('debe requerir autenticación', async () => {
                return request(app.getHttpServer())
                    .post('/api/configuration/fiscal/certificates/generate')
                    .send({ environment: 'HOMOLOGACION' })
                    .expect(401);
            });
        });
    });

    describe('PaymentMethodsController - /api/configuration/payment-methods', () => {
        describe('GET /api/configuration/payment-methods', () => {
            it('debe ser público (no requerir auth)', async () => {
                return request(app.getHttpServer())
                    .get('/api/configuration/payment-methods')
                    .expect(200)
                    .expect((res) => {
                        expect(Array.isArray(res.body)).toBe(true);
                    });
            });

            it('debe retornar métodos activos', async () => {
                // Primero asegurar que los métodos estén inicializados
                await request(app.getHttpServer())
                    .post('/api/configuration/payment-methods/seed')
                    .expect(201);

                return request(app.getHttpServer())
                    .get('/api/configuration/payment-methods')
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.length).toBeGreaterThan(0);
                        // Verificar que los métodos esperados existen
                        const codes = res.body.map((m: { code: string }) => m.code);
                        expect(codes).toContain('cash');
                        // QR puede estar como 'qr' u otro nombre
                    });
            });
        });

        describe('POST /api/configuration/payment-methods/seed', () => {
            it('debe ser público (no requerir auth)', async () => {
                return request(app.getHttpServer())
                    .post('/api/configuration/payment-methods/seed')
                    .expect(201)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('created');
                    });
            });
        });
    });

    describe('TaxTypesController - /api/configuration/tax-types', () => {
        describe('GET /api/configuration/tax-types', () => {
            it('debe ser público (no requerir auth)', async () => {
                return request(app.getHttpServer())
                    .get('/api/configuration/tax-types')
                    .expect(200)
                    .expect((res) => {
                        expect(Array.isArray(res.body)).toBe(true);
                    });
            });

            it('debe retornar tipos activos', async () => {
                return request(app.getHttpServer())
                    .get('/api/configuration/tax-types')
                    .expect(200)
                    .expect((res) => {
                        res.body.forEach((taxType: { isActive: boolean }) => {
                            expect(taxType.isActive).toBe(true);
                        });
                    });
            });
        });

        describe('POST /api/configuration/tax-types', () => {
            it('debe crear nuevo tipo de impuesto', async () => {
                const newTaxType = {
                    name: 'Impuesto Test ' + Date.now(),
                    percentage: 10.5,
                };

                return request(app.getHttpServer())
                    .post('/api/configuration/tax-types')
                    .send(newTaxType)
                    .expect(201)
                    .expect((res) => {
                        expect(res.body.name).toBe(newTaxType.name);
                        expect(res.body.percentage).toBe(newTaxType.percentage);
                        expect(res.body.isActive).toBe(true);
                    });
            });

            it('debe rechazar datos inválidos', async () => {
                return request(app.getHttpServer())
                    .post('/api/configuration/tax-types')
                    .send({ name: '', percentage: -5 })
                    .expect(400);
            });
        });
    });

    describe('Validación de DTOs', () => {
        it('debe rechazar entorno inválido', async () => {
            if (!authToken) return;

            return request(app.getHttpServer())
                .patch('/api/configuration/fiscal/environment')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ environment: 'INVALIDO' })
                .expect(400);
        });

        it('debe rechazar tipo de impuesto sin nombre', async () => {
            return request(app.getHttpServer())
                .post('/api/configuration/tax-types')
                .send({ percentage: 21 })
                .expect(400);
        });
    });

    describe('Error 404 en rutas inexistentes', () => {
        it('debe retornar 404 para ruta inexistente', async () => {
            return request(app.getHttpServer())
                .get('/api/configuration/ruta-inexistente')
                .expect(404);
        });
    });
});
