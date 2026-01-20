/**
 * Smoke tests rápidos para API de módulo products
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getAuthToken } from '../../test/helpers/auth.helper';

describe('Smoke Tests - Products (API)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [
                ProductsModule,
            ],
        }).compile();

        app = module.createNestApplication();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /api/products → responde 200 con estructura correcta', async () => {
        const token = getAuthToken(app);
        const response = await request(app.getHttpServer())
            .get('/api/products')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/products/:id → ParseUUIDPipe funciona', async () => {
        const token = getAuthToken(app);
        const response = await request(app.getHttpServer())
            .get('/api/products')
            .set('Authorization', `Bearer ${token}`);

        const products = await request(app.getHttpServer())
            .get('/api/products')
            .set('Authorization', `Bearer ${token}`);

        const firstProduct = products.body.data[0];
        const response = await request(app.getHttpServer())
            .get(`/api/products/${firstProduct.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(firstProduct.id);

        await request(app.getHttpServer())
            .get(`/api/products/invalid-uuid`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
    });

    it('GET /api/categories → responde 200', async () => {
        const token = getAuthToken(app);
        const response = await request(app.getHttpServer())
            .get('/api/categories')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/brands → responde 200', async () => {
        const token = getAuthToken(app);
        const response = await request(app.getHttpServer())
            .get('/api/brands')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET sin token → 401', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/products');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
    });
});
