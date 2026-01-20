import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import request from 'supertest';

/**
 * Smoke Tests para API Básica
 *
 * Estos tests verifican que los endpoints públicos críticos
 * responden correctamente sin necesidad de autenticación.
 * Se ejecutan rápidamente y son los primeros en detectar
 * problemas básicos de configuración o despliegue.
 */

describe('Smoke Tests - API Básica', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configurar pipes globales como en producción
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = app.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Conexión a Base de Datos', () => {
    it('debe estar conectado a la base de datos', async () => {
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });

    it('debe poder ejecutar una consulta simple', async () => {
      const result = await dataSource.query('SELECT 1 as result');
      expect(result).toHaveLength(1);
      expect(result[0].result).toBe(1);
    });
  });

  describe('Endpoints Públicos - Auth', () => {
    it('GET / debe retornar respuesta básica', async () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('GET /health debe retornar estado del sistema', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('services');
          expect(res.body.services).toHaveProperty('api');
          expect(res.body.services).toHaveProperty('database');
        });
    });

    it('POST /auth/login debe rechazar credenciales inválidas con 401', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'invalid', password: 'invalid' })
        .expect(401);
    });

    it('POST /auth/login debe rechazar request sin credenciales con 400', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('Estructura de Respuesta', () => {
    it('GET /health debe tener estructura correcta', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          const body = res.body;

          // Verificar estructura básica
          expect(body).toBeInstanceOf(Object);
          expect(body.status).toMatch(/^(ok|error)$/);

          // Verificar timestamp válido
          expect(body.timestamp).toBeDefined();
          const timestamp = new Date(body.timestamp);
          expect(timestamp.toString()).not.toBe('Invalid Date');

          // Verificar uptime
          expect(body.uptime).toBeDefined();
          expect(typeof body.uptime).toBe('number');
          expect(body.uptime).toBeGreaterThanOrEqual(0);

          // Verificar servicios
          expect(body.services).toBeInstanceOf(Object);
          expect(body.services.api).toBeDefined();
          expect(body.services.database).toBeDefined();
        });
    });
  });

  describe('Tiempo de Respuesta - Performance Básica', () => {
    it('GET /health debe responder en menos de 100ms', async () => {
      const start = Date.now();

      await request(app.getHttpServer()).get('/health').expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('GET / debe responder en menos de 50ms', async () => {
      const start = Date.now();

      await request(app.getHttpServer()).get('/').expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Manejo de Errores', () => {
    it('GET /ruta-inexistente debe retornar 404', async () => {
      return request(app.getHttpServer())
        .get('/ruta-inexistente')
        .expect(404);
    });

    it('POST /auth/login con payload inválido debe retornar 401 (no 500)', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: '', password: '' })
        .expect((res) => {
          // No debe ser un error del servidor
          expect(res.status).not.toBe(500);
          expect([400, 401]).toContain(res.status);
        });
    });
  });
});
