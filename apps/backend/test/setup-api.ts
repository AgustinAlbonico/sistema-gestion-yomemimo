/**
 * Setup para tests de API (HTTP endpoints)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

export let app: INestApplication;
export let moduleRef: TestingModule;

beforeAll(async () => {
    // Usar variables de entorno de test
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433';
    process.env.DB_USERNAME = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'nexopos_test';
    process.env.JWT_SECRET = 'test-secret-key';

    moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    await app.init();
});

afterAll(async () => {
    await app?.close();
});

// Helper para obtener token de autenticación
export const getAuthToken = async (): Promise<string> => {
    const request = await import('supertest');

    const res = await request.default(app.getHttpServer())
        .post('/api/auth/login')
        .send({
            username: 'admin',
            password: 'Admin123',
        });

    return res.body.access_token;
};
