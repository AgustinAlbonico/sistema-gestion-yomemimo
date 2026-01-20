/**
 * Smoke Tests de Performance Básica
 *
 * Valida tiempos de respuesta básicos para identificar
 * regresiones de performance en el sistema.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

// Umbrales de performance (en milisegundos)
const PERFORMANCE_THRESHOLDS = {
    HEALTH_CHECK: 100,  // /health debe responder en < 100ms
    SIMPLE_GET: 50,      // GET simple en < 50ms
    AUTH_LOGIN: 500,     // Login debe completar en < 500ms (sin BD real es rápido)
    API_ENDPOINT: 1000,  // Endpoints de API en < 1s
};

interface PerformanceMetric {
    endpoint: string;
    duration: number;
    threshold: number;
    passed: boolean;
}

const metrics: PerformanceMetric[] = [];

describe('Smoke Tests - Performance Básica', () => {
    let app: INestApplication;

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
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }

        // Reportar métricas al final
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('PERFORMANCE METRICS SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        metrics.forEach((m) => {
            const status = m.passed ? '✅ PASS' : '❌ FAIL';
            const percentage = Math.round((m.duration / m.threshold) * 100);
            console.log(`${status} ${m.endpoint}: ${m.duration}ms (threshold: ${m.threshold}ms, ${percentage}%)`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    function measurePerformance<T>(
        endpoint: string,
        threshold: number,
        fn: () => Promise<T>
    ): Promise<T> {
        const start = Date.now();
        return fn().finally(() => {
            const duration = Date.now() - start;
            const passed = duration <= threshold;
            metrics.push({ endpoint, duration, threshold, passed });
        });
    }

    describe('Endpoints Críticos - Performance', () => {
        it('GET /health debe responder rápido (< 100ms)', async () => {
            await measurePerformance(
                'GET /health',
                PERFORMANCE_THRESHOLDS.HEALTH_CHECK,
                () =>
                    request(app.getHttpServer())
                        .get('/health')
                        .expect(200)
            );

            const lastMetric = metrics[metrics.length - 1];
            expect(lastMetric.passed).toBe(true);
        });

        it('GET / debe responder muy rápido (< 50ms)', async () => {
            await measurePerformance(
                'GET /',
                PERFORMANCE_THRESHOLDS.SIMPLE_GET,
                () =>
                    request(app.getHttpServer())
                        .get('/')
                        .expect(200)
            );

            const lastMetric = metrics[metrics.length - 1];
            expect(lastMetric.passed).toBe(true);
        });

        it('POST /auth/login debe completarse rápido (< 500ms)', async () => {
            await measurePerformance(
                'POST /auth/login',
                PERFORMANCE_THRESHOLDS.AUTH_LOGIN,
                () =>
                    request(app.getHttpServer())
                        .post('/auth/login')
                        .send({
                            username: 'test',
                            password: 'test',
                        })
                        .expect((res) => [200, 401].includes(res.status))
            );

            const lastMetric = metrics[metrics.length - 1];
            expect(lastMetric.passed).toBe(true);
        });

        it('GET /products debe responder razonablemente rápido (< 1s)', async () => {
            await measurePerformance(
                'GET /products',
                PERFORMANCE_THRESHOLDS.API_ENDPOINT,
                () =>
                    request(app.getHttpServer())
                        .get('/products')
                        .expect((res) => [200, 401, 403].includes(res.status))
            );

            const lastMetric = metrics[metrics.length - 1];
            expect(lastMetric.passed).toBe(true);
        });
    });

    describe('Regresiones de Performance', () => {
        it('no debe haber degradación de performance en /health', async () => {
            // Hacer múltiples requests y verificar que el tiempo no se degrade
            const times: number[] = [];

            for (let i = 0; i < 5; i++) {
                const start = Date.now();
                await request(app.getHttpServer()).get('/health').expect(200);
                times.push(Date.now() - start);
            }

            // El último request no debe ser más del doble que el primero
            // (indicando posible memory leak o problema de recursos)
            const firstTime = times[0];
            const lastTime = times[times.length - 1];
            const ratio = lastTime / firstTime;

            expect(ratio).toBeLessThan(2); // No más del doble
            console.log(`Performance degradation check: ${firstTime}ms -> ${lastTime}ms (ratio: ${ratio.toFixed(2)}x)`);
        });
    });

    describe('Umbrales Advertencia - Warning si es lento pero no crítico', () => {
        it('debe advertir si /health toma más de 50ms pero menos de 100ms', async () => {
            const start = Date.now();
            await request(app.getHttpServer()).get('/health').expect(200);
            const duration = Date.now() - start;

            if (duration > 50) {
                console.warn(`⚠️  Warning: /health took ${duration}ms (target: < 50ms)`);
            }
        });
    });
});
