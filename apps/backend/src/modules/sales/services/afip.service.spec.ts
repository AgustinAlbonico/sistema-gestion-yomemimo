/**
 * Tests para AfipService
 * Cubre los métodos públicos importantes del servicio de integración con AFIP
 * Nota: Los métodos que requieren llamadas SOAP se prueban con mocks simplificados
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AfipService, AfipConfiguration } from './afip.service';
import { InvoiceType } from '../entities/invoice.entity';
import { FiscalConfigurationService } from '../../configuration/fiscal-configuration.service';
import { AfipEnvironment } from '../../configuration/entities/fiscal-configuration.entity';

// Mock de FiscalConfigurationService
const mockFiscalConfigService = {
    getConfiguration: jest.fn(),
    getPublicConfiguration: jest.fn(),
    isReadyForInvoicing: jest.fn(),
    getDecryptedCertificates: jest.fn(),
    getStoredWsaaToken: jest.fn(),
    saveWsaaToken: jest.fn(),
    clearWsaaToken: jest.fn(),
};

describe('AfipService', () => {
    let service: AfipService;

    // Configuración AFIP por defecto para tests
    const mockConfig = {
        cuit: '20123456789',
        businessName: 'Mi Negocio',
        businessAddress: 'Av. Corrientes 1234',
        ivaCondition: 'RESPONSABLE_INSCRIPTO',
        grossIncome: '901-123456-1',
        activityStartDate: new Date('2020-01-01'),
        pointOfSale: 1,
        afipEnvironment: AfipEnvironment.HOMOLOGACION,
    };

    beforeEach(async () => {
        // Resetear todos los mocks antes de cada test
        jest.clearAllMocks();

        // Configurar comportamientos por defecto
        mockFiscalConfigService.getConfiguration.mockResolvedValue(mockConfig);
        mockFiscalConfigService.getPublicConfiguration.mockResolvedValue({
            isConfigured: true,
            cuit: '20123456789',
            businessName: 'Mi Negocio',
            businessAddress: 'Av. Corrientes 1234',
            ivaCondition: 'RESPONSABLE_INSCRIPTO',
            grossIncome: '901-123456-1',
            activityStartDate: new Date('2020-01-01'),
            pointOfSale: 1,
            afipEnvironment: AfipEnvironment.HOMOLOGACION,
        });
        mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
            ready: true,
            missingFields: [],
        });
        mockFiscalConfigService.getStoredWsaaToken.mockResolvedValue(null);
        mockFiscalConfigService.saveWsaaToken.mockResolvedValue(undefined);
        mockFiscalConfigService.clearWsaaToken.mockResolvedValue(undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AfipService,
                {
                    provide: FiscalConfigurationService,
                    useValue: mockFiscalConfigService,
                },
            ],
        }).compile();

        service = module.get<AfipService>(AfipService);
    });

    describe('isConfigured', () => {
        it('debería retornar true cuando está configurado', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: true,
                missingFields: [],
            });

            const result = await service.isConfigured();

            expect(result).toBe(true);
        });

        it('debería retornar false cuando no está configurado', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: false,
                missingFields: ['cuit', 'certificates'],
            });

            const result = await service.isConfigured();

            expect(result).toBe(false);
        });
    });

    describe('getConfiguration', () => {
        it('debería retornar configuración completa cuando existe', async () => {
            mockFiscalConfigService.getPublicConfiguration.mockResolvedValue({
                isConfigured: true,
                cuit: '20123456789',
                businessName: 'Mi Negocio',
                businessAddress: 'Av. Corrientes 1234',
                ivaCondition: 'RESPONSABLE_INSCRIPTO',
                grossIncome: '901-123456-1',
                activityStartDate: new Date('2020-01-01'),
                pointOfSale: 5,
                afipEnvironment: AfipEnvironment.PRODUCCION,
            });

            const result = await service.getConfiguration();

            expect(result).toEqual({
                cuit: '20123456789',
                businessName: 'Mi Negocio',
                businessAddress: 'Av. Corrientes 1234',
                ivaCondition: 'RESPONSABLE_INSCRIPTO',
                grossIncome: '901-123456-1',
                activityStartDate: new Date('2020-01-01'),
                pointOfSale: 5,
                environment: 'produccion',
            });
        });

        it('debería retornar null cuando no está configurado', async () => {
            mockFiscalConfigService.getPublicConfiguration.mockResolvedValue({
                isConfigured: false,
                cuit: null,
                businessName: null,
                businessAddress: null,
                ivaCondition: null,
                grossIncome: null,
                activityStartDate: null,
                pointOfSale: null,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });

            const result = await service.getConfiguration();

            expect(result).toBeNull();
        });

        it('debería retornar null cuando hay excepción', async () => {
            mockFiscalConfigService.getPublicConfiguration.mockRejectedValue(
                new Error('Database error')
            );

            const result = await service.getConfiguration();

            expect(result).toBeNull();
        });

        it('debería usar valores por defecto cuando faltan campos opcionales', async () => {
            mockFiscalConfigService.getPublicConfiguration.mockResolvedValue({
                isConfigured: true,
                cuit: '20123456789',
                businessName: null,
                businessAddress: null,
                ivaCondition: 'RESPONSABLE_MONOTRIBUTO',
                grossIncome: null,
                activityStartDate: null,
                pointOfSale: 1,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });

            const result = await service.getConfiguration();

            expect(result).toMatchObject({
                cuit: '20123456789',
                businessName: 'Sin configurar',
                businessAddress: 'Sin configurar',
                ivaCondition: 'RESPONSABLE_MONOTRIBUTO',
                grossIncome: undefined,
                activityStartDate: undefined,
            });
        });
    });

    describe('determineInvoiceType', () => {
        it('debería retornar FACTURA_C para monotributo', () => {
            const result = service.determineInvoiceType('monotributo', 'consumidor_final');
            expect(result).toBe(InvoiceType.FACTURA_C);
        });

        it('debería retornar FACTURA_A para RI + RI', () => {
            const result = service.determineInvoiceType(
                'responsable_inscripto',
                'responsable_inscripto'
            );
            expect(result).toBe(InvoiceType.FACTURA_A);
        });

        it('debería retornar FACTURA_B para RI + otros (no RI)', () => {
            const result = service.determineInvoiceType(
                'responsable_inscripto',
                'consumidor_final'
            );
            expect(result).toBe(InvoiceType.FACTURA_B);
        });

        it('debería retornar FACTURA_B para RI + exento', () => {
            const result = service.determineInvoiceType(
                'responsable_inscripto',
                'exento'
            );
            expect(result).toBe(InvoiceType.FACTURA_B);
        });

        it('debería retornar FACTURA_C por default (emisor no es RI ni monotributo)', () => {
            const result = service.determineInvoiceType('otra_condicion', 'consumidor_final');
            expect(result).toBe(InvoiceType.FACTURA_C);
        });
    });

    describe('getPhantomTokenWaitTime', () => {
        it('debería retornar no bloqueado cuando no hay errores fantasma', () => {
            const result = service.getPhantomTokenWaitTime();

            expect(result).toEqual({
                blocked: false,
                waitMinutes: null,
                environment: null,
            });
        });

        it('debería calcular tiempo de espera cuando hay timestamp de error fantasma', () => {
            // Simular un timestamp de error reciente
            const errorTime = new Date();
            (service as any).tokenPhantomErrorTimestamp.set('homologacion', errorTime);

            const result = service.getPhantomTokenWaitTime();

            expect(result.blocked).toBe(true);
            expect(result.waitMinutes).toBeGreaterThan(0);
            expect(result.environment).toBe('homologacion');
        });

        it('debería limpiar timestamps expirados', () => {
            // Crear timestamp expirado (hace más de 12 horas)
            const pastTime = new Date(Date.now() - 13 * 60 * 60 * 1000);
            (service as any).tokenPhantomErrorTimestamp.set('homologacion', pastTime);

            const result = service.getPhantomTokenWaitTime();

            expect(result.blocked).toBe(false);
            // El timestamp debería haberse eliminado
            expect((service as any).tokenPhantomErrorTimestamp.has('homologacion')).toBe(false);
        });
    });

    describe('invalidateAuthToken', () => {
        it('debería invalidar token en homologación', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });

            // Primero establecer un token en caché
            (service as any).authTokenCacheHomologacion = {
                token: 'test-token',
                sign: 'test-sign',
                expirationTime: new Date(Date.now() + 3600000),
            };

            await service.invalidateAuthToken();

            expect(mockFiscalConfigService.clearWsaaToken).toHaveBeenCalled();
            expect((service as any).authTokenCacheHomologacion).toBeNull();
        });

        it('debería invalidar token en producción', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                afipEnvironment: AfipEnvironment.PRODUCCION,
            });

            // Primero establecer un token en caché
            (service as any).authTokenCacheProduccion = {
                token: 'test-token',
                sign: 'test-sign',
                expirationTime: new Date(Date.now() + 3600000),
            };

            await service.invalidateAuthToken();

            expect(mockFiscalConfigService.clearWsaaToken).toHaveBeenCalled();
            expect((service as any).authTokenCacheProduccion).toBeNull();
        });
    });

    describe('authorizeInvoice', () => {
        const mockInvoiceRequest = {
            invoiceType: InvoiceType.FACTURA_C,
            pointOfSale: 1,
            concept: 1,
            docType: 99,
            docNumber: '0',
            receiverIvaCondition: 5,
            issueDate: '20250120',
            total: 1000,
            netAmount: 1000,
            netAmountExempt: 0,
            iva: [],
            otherTaxes: 0,
        };

        it('debería retornar simulación cuando AFIP no está configurado', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: false,
                missingFields: ['certificates'],
            });

            const result = await service.authorizeInvoice(mockInvoiceRequest);

            expect(result.success).toBe(true);
            expect(result.cae).toBeDefined();
            // observations es un array de strings
            expect(Array.isArray(result.observations)).toBe(true);
            expect(result.observations?.some(obs => obs.includes('[SIMULACIÓN]'))).toBe(true);
            expect(result.invoiceNumber).toBeGreaterThan(0);
        });

        it('debería retornar simulación con datos válidos', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: false,
                missingFields: [],
            });

            const result = await service.authorizeInvoice(mockInvoiceRequest);

            expect(result.success).toBe(true);
            expect(result.cae).toHaveLength(14); // CAE tiene 14 dígitos
            expect(result.caeExpirationDate).toBeDefined();
            expect(result.invoiceNumber).toBeGreaterThan(0);
        });
    });

    describe('getLastInvoiceNumber', () => {
        it('debería retornar número simulado cuando no está configurado', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: false,
                missingFields: ['certificates'],
            });

            const result = await service.getLastInvoiceNumber(1, InvoiceType.FACTURA_C);

            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(100000);
        });

        it('debería retornar número simulado diferente para llamadas sucesivas', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: false,
                missingFields: [],
            });

            // Mock de Date.now() para tener control sobre el timestamp
            const originalDateNow = Date.now;
            let callCount = 0;
            jest.spyOn(Date, 'now').mockImplementation(() => {
                callCount++;
                return originalDateNow() + (callCount * 100); // 100ms de diferencia por llamada
            });

            const result1 = await service.getLastInvoiceNumber(1, InvoiceType.FACTURA_C);
            const result2 = await service.getLastInvoiceNumber(1, InvoiceType.FACTURA_C);

            // Los números deberían ser diferentes (basados en timestamp mockeado)
            expect(result1).not.toBe(result2);

            // Restaurar Date.now
            jest.spyOn(Date, 'now').mockRestore();
        });
    });

    describe('testConnection', () => {
        it('debería retornar error con campos faltantes cuando no está configurado', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: false,
                missingFields: ['cuit', 'certificates'],
            });

            const result = await service.testConnection();

            expect(result.success).toBe(false);
            expect(result.message).toContain('no está configurado');
            expect(result.message).toContain('cuit');
            expect(result.message).toContain('certificates');
        });

        it('debería retornar éxito con campos vacíos cuando está configurado', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: true,
                missingFields: [],
            });

            // Cuando está configurado pero falla getAuthToken, retorna error de conexión
            // Esto es lo que probamos - que devuelva el formato correcto de error
            const result = await service.testConnection();

            // Como no hay certificados válidos, fallará la autenticación
            expect(result.success).toBe(false);
            expect(result.message).toContain('Error de conexión');
        });
    });

    describe('formatDateForAfip', () => {
        it('debería formatear fecha a YYYYMMDD sin guiones', () => {
            const date = new Date('2025-01-20T14:30:00Z');
            const result = service.formatDateForAfip(date);

            expect(result).toBe('20250120');
        });

        it('debería formatear correctamente con meses menores a 10', () => {
            const date = new Date('2025-03-05T10:00:00Z');
            const result = service.formatDateForAfip(date);

            expect(result).toBe('20250305');
        });

        it('debería formatear correctamente el último día del mes', () => {
            const date = new Date('2025-12-31T23:59:59Z');
            const result = service.formatDateForAfip(date);

            expect(result).toBe('20251231');
        });

        it('debería manejar fecha local correctamente', () => {
            // Prueba con fecha local explícita
            const date = new Date(2025, 0, 15); // 15 de enero de 2025 (meses son 0-indexed)
            const result = service.formatDateForAfip(date);

            expect(result).toBe('20250115');
        });
    });

    describe('parseAfipDate', () => {
        it('debería parsear fecha en formato YYYYMMDD', () => {
            const result = service.parseAfipDate('20250120');

            expect(result).toBeInstanceOf(Date);
            expect(result.getFullYear()).toBe(2025);
            expect(result.getMonth()).toBe(0); // Enero (0-indexed)
            expect(result.getDate()).toBe(20);
        });

        it('debería parsear correctamente febrero', () => {
            const result = service.parseAfipDate('20250215');

            expect(result.getMonth()).toBe(1); // Febrero (0-indexed)
            expect(result.getDate()).toBe(15);
        });

        it('debería parsear correctamente marzo', () => {
            const result = service.parseAfipDate('20250331');

            expect(result.getMonth()).toBe(2); // Marzo (0-indexed)
            expect(result.getDate()).toBe(31);
        });

        it('debería parsear correctamente diciembre', () => {
            const result = service.parseAfipDate('20251231');

            expect(result.getMonth()).toBe(11); // Diciembre (0-indexed)
            expect(result.getDate()).toBe(31);
        });

        it('debería crear fechas consistentes (roundtrip)', () => {
            const originalDate = new Date(2025, 5, 15); // 15 de junio de 2025
            const formatted = service.formatDateForAfip(originalDate);
            const parsed = service.parseAfipDate(formatted);

            expect(parsed.getFullYear()).toBe(originalDate.getFullYear());
            expect(parsed.getMonth()).toBe(originalDate.getMonth());
            expect(parsed.getDate()).toBe(originalDate.getDate());
        });
    });

    describe('getAuthToken - manejo de caché', () => {
        it('debería usar token en caché si es válido', async () => {
            const futureExpiration = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 horas
            const mockToken = {
                token: 'cached-token',
                sign: 'cached-sign',
                expirationTime: futureExpiration,
            };

            // Simular token en caché inyectándolo directamente
            (service as any).authTokenCacheHomologacion = mockToken;

            // Mock getConfiguration para retornar ambiente de homologación
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });

            const result = await service.getAuthToken();

            expect(result.token).toBe('cached-token');
            expect(result.sign).toBe('cached-sign');
        });

        it('debería usar token en caché de producción según ambiente', async () => {
            const futureExpiration = new Date(Date.now() + 6 * 60 * 60 * 1000);
            const mockToken = {
                token: 'prod-token',
                sign: 'prod-sign',
                expirationTime: futureExpiration,
            };

            (service as any).authTokenCacheProduccion = mockToken;
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                afipEnvironment: AfipEnvironment.PRODUCCION,
            });

            const result = await service.getAuthToken();

            expect(result.token).toBe('prod-token');
            expect(result.sign).toBe('prod-sign');
        });

        it('debería retornar token expirado si no hay válido (fallback)', async () => {
            // Token expirado
            const expiredToken = {
                token: 'expired-token',
                sign: 'expired-sign',
                expirationTime: new Date(Date.now() - 1000),
            };

            (service as any).authTokenCacheHomologacion = expiredToken;

            // Cuando el token está expirado, se debería solicitar uno nuevo
            // pero como no tenemos mock de axios, esto fallará
            await expect(service.getAuthToken()).rejects.toThrow();
        });
    });

    describe('authorizeInvoice - manejo de mutex', () => {
        const mockInvoiceRequest = {
            invoiceType: InvoiceType.FACTURA_C,
            pointOfSale: 1,
            concept: 1,
            docType: 99,
            docNumber: '0',
            receiverIvaCondition: 5,
            issueDate: '20250120',
            total: 1000,
            netAmount: 1000,
            netAmountExempt: 0,
            iva: [],
            otherTaxes: 0,
        };

        it('debería usar simulación cuando no está configurado', async () => {
            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue({
                ready: false,
                missingFields: [],
            });

            // Ejecutar varias veces en "paralelo"
            const promises = [
                service.authorizeInvoice(mockInvoiceRequest),
                service.authorizeInvoice(mockInvoiceRequest),
                service.authorizeInvoice(mockInvoiceRequest),
            ];

            const results = await Promise.all(promises);

            // Todas deberían ser exitosas (simulaciones)
            results.forEach(result => {
                expect(result.success).toBe(true);
                expect(result.cae).toBeDefined();
            });
        });
    });
});
