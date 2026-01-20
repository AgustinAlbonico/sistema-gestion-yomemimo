/**
 * Helper para authentication en tests de API
 */
/**
 * Helper para authentication en tests de API
 */
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

const createTestApp = async (): Promise<INestApplication> => {
    const module = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    return module.createNestApplication();
};

export const getAuthToken = async (app: INestApplication): Promise<string> => {
    const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
            username: 'admin',
            password: '123456',
        });

    const token = response.body.accessToken;
    return `Bearer ${token}`;
};

export const createAuthenticatedRequest = (app: INestApplication) => {
    return request(app.getHttpServer());
};

export const getAuthToken = async (app: INestApplication): Promise<string> => {
    const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
            username: 'admin',
            password: '123456',
        });

    const token = response.body.accessToken;
    return `Bearer ${token}`;
};

export const createAuthenticatedRequest = (app: INestApplication) => {
    return request(app.getHttpServer());
};

export const getAuthToken = async (app: INestApplication): Promise<string> => {
    const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
            username: 'admin',
            password: 'admin123',
        });

    const token = response.body.accessToken;
    return `Bearer ${token}`;
};

export const createAuthenticatedRequest = (app: INestApplication) => {
    return request(app.getHttpServer());
};
