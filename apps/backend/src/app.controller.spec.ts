import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

describe('AppController - Smoke Tests', () => {
  let appController: AppController;
  let appService: AppService;

  // Mock del AppService
  const mockAppService = {
    getHealthCheck: jest.fn(),
    getHello: jest.fn(),
  };

  // Mock del DataSource
  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('GET /health - Smoke Test', () => {
    it('debe retornar 200 y estado ok cuando todos los servicios están funcionando', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 1234,
        services: {
          api: { status: 'up' },
          database: { status: 'up' },
        },
      };

      mockAppService.getHealthCheck.mockResolvedValue(healthResponse);

      const result = await appController.health();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.services.api.status).toBe('up');
      expect(result.services.database.status).toBe('up');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('debe lanzar ServiceUnavailableException cuando el estado es error', async () => {
      const errorHealth = {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: 1234,
        services: {
          api: { status: 'up' },
          database: { status: 'down' },
        },
      };

      mockAppService.getHealthCheck.mockResolvedValue(errorHealth);

      await expect(appController.health()).rejects.toThrow(ServiceUnavailableException);
    });

    it('debe incluir timestamp válido en formato ISO', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: 1234,
        services: {
          api: { status: 'up' },
          database: { status: 'up' },
        },
      };

      mockAppService.getHealthCheck.mockResolvedValue(healthResponse);

      const result = await appController.health();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('debe incluir uptime del proceso', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: expect.any(String),
        uptime: 100.5,
        services: {
          api: { status: 'up' },
          database: { status: 'up' },
        },
      };

      mockAppService.getHealthCheck.mockResolvedValue(healthResponse);

      const result = await appController.health();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health - Verificación de Servicios', () => {
    it('debe reportar API como up', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 1234,
        services: {
          api: { status: 'up' },
          database: { status: 'up' },
        },
      };

      mockAppService.getHealthCheck.mockResolvedValue(healthResponse);

      const result = await appController.health();

      expect(result.services).toBeDefined();
      expect(result.services.api).toBeDefined();
      expect(result.services.api.status).toBe('up');
    });

    it('debe reportar estado de la base de datos', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 1234,
        services: {
          api: { status: 'up' },
          database: { status: 'up' },
        },
      };

      mockAppService.getHealthCheck.mockResolvedValue(healthResponse);

      const result = await appController.health();

      expect(result.services.database).toBeDefined();
      expect(['up', 'down']).toContain(result.services.database.status);
    });
  });
});
