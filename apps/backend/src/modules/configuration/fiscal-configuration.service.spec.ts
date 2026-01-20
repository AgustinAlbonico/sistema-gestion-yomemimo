/**
 * Tests unitarios para FiscalConfigurationService
 * Cubre: onModuleInit, getConfiguration, getPublicConfiguration, updateEmitterData,
 *        setEnvironment, uploadCertificates, deleteCertificates, getDecryptedCertificates,
 *        getCertificateExpirationStatus, isReadyForInvoicing, testAfipConnection,
 *        WSAA token management
 * Enfoque: Pruebas de comportamiento usando mocks de repositorio y servicio de cifrado
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { FiscalConfigurationService } from './fiscal-configuration.service';
import { FiscalConfiguration, AfipEnvironment } from './entities/fiscal-configuration.entity';
import { CertificateEncryptionService } from './certificate-encryption.service';
import { IvaCondition } from '../../common/enums/iva-condition.enum';

// Mock de configuración fiscal
const createMockFiscalConfig = (overrides = {}): FiscalConfiguration => ({
    id: 'fiscal-config-uuid',
    businessName: 'Empresa Test S.A.',
    cuit: '20012345675', // CUIT válido: 20-01234567-5
    grossIncome: '123456789',
    activityStartDate: new Date('2020-01-01'),
    businessAddress: 'Calle Falsa 123',
    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
    pointOfSale: 1,
    afipEnvironment: AfipEnvironment.HOMOLOGACION,
    isConfigured: true,
    homologacionCertificate: null,
    homologacionPrivateKey: null,
    homologacionReady: true,
    homologacionUploadedAt: new Date('2025-01-01'),
    homologacionExpiresAt: new Date('2026-01-01'),
    homologacionFingerprint: 'abc123',
    produccionCertificate: null,
    produccionPrivateKey: null,
    produccionReady: false,
    produccionUploadedAt: null,
    produccionExpiresAt: null,
    produccionFingerprint: null,
    wsaaTokenHomologacion: 'token-homologacion',
    wsaaSignHomologacion: 'sign-homologacion',
    wsaaTokenExpirationHomologacion: new Date('2026-12-31'),
    wsaaTokenProduccion: null,
    wsaaSignProduccion: null,
    wsaaTokenExpirationProduccion: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

// Mocks
const mockFiscalConfigRepo = {
    count: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
};

const mockEncryptionService = {
    isConfigured: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    generateFingerprint: jest.fn(),
};

describe('FiscalConfigurationService', () => {
    let service: FiscalConfigurationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FiscalConfigurationService,
                { provide: getRepositoryToken(FiscalConfiguration), useValue: mockFiscalConfigRepo },
                { provide: CertificateEncryptionService, useValue: mockEncryptionService },
            ],
        }).compile();

        service = module.get<FiscalConfigurationService>(FiscalConfigurationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('onModuleInit()', () => {
        it('debe crear configuración fiscal por defecto si no existe', async () => {
            mockFiscalConfigRepo.count.mockResolvedValue(0);
            mockFiscalConfigRepo.save.mockResolvedValue(createMockFiscalConfig());

            await service.onModuleInit();

            expect(mockFiscalConfigRepo.count).toHaveBeenCalled();
            expect(mockFiscalConfigRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                    pointOfSale: 1,
                    afipEnvironment: AfipEnvironment.HOMOLOGACION,
                    isConfigured: false,
                    homologacionReady: false,
                    produccionReady: false,
                })
            );
        });

        it('no debe crear configuración si ya existe', async () => {
            mockFiscalConfigRepo.count.mockResolvedValue(1);

            await service.onModuleInit();

            expect(mockFiscalConfigRepo.count).toHaveBeenCalled();
            expect(mockFiscalConfigRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('getConfiguration()', () => {
        it('debe retornar la configuración fiscal existente', async () => {
            const config = createMockFiscalConfig();
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getConfiguration();

            expect(result).toEqual(config);
        });

        it('debe lanzar error si no existe configuración', async () => {
            mockFiscalConfigRepo.find.mockResolvedValue([]);

            await expect(service.getConfiguration()).rejects.toThrow('Configuración fiscal no inicializada');
        });
    });

    describe('getPublicConfiguration()', () => {
        it('debe retornar configuración excluyendo datos sensibles', async () => {
            const config = createMockFiscalConfig();
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getPublicConfiguration();

            // Verificar que no incluye certificados ni tokens
            expect(result).not.toHaveProperty('homologacionCertificate');
            expect(result).not.toHaveProperty('homologacionPrivateKey');
            expect(result).not.toHaveProperty('produccionCertificate');
            expect(result).not.toHaveProperty('produccionPrivateKey');
            expect(result).not.toHaveProperty('wsaaTokenHomologacion');
            expect(result).not.toHaveProperty('wsaaSignHomologacion');
            expect(result).not.toHaveProperty('wsaaTokenProduccion');
            expect(result).not.toHaveProperty('wsaaSignProduccion');

            // Verificar que incluye metadatos de certificados
            expect(result).toHaveProperty('homologacionReady');
            expect(result).toHaveProperty('homologacionUploadedAt');
            expect(result).toHaveProperty('homologacionExpiresAt');
            expect(result).toHaveProperty('homologacionFingerprint');
        });

        it('debe incluir campos públicos básicos', async () => {
            const config = createMockFiscalConfig();
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getPublicConfiguration();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('businessName');
            expect(result).toHaveProperty('cuit');
            expect(result).toHaveProperty('ivaCondition');
            expect(result).toHaveProperty('pointOfSale');
            expect(result).toHaveProperty('afipEnvironment');
            expect(result).toHaveProperty('isConfigured');
        });
    });

    describe('updateEmitterData()', () => {
        const mockConfig = createMockFiscalConfig();

        beforeEach(() => {
            mockFiscalConfigRepo.find.mockResolvedValue([mockConfig]);
            mockFiscalConfigRepo.save.mockResolvedValue(mockConfig);
        });

        it('debe actualizar businessName', async () => {
            const dto = { businessName: 'Nueva Empresa S.A.' };
            await service.updateEmitterData(dto);

            expect(mockFiscalConfigRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ businessName: 'Nueva Empresa S.A.' })
            );
        });

        it('debe validar CUIT válido', async () => {
            const dto = { cuit: '20012345675' }; // CUIT válido: 20-01234567-5
            await service.updateEmitterData(dto);

            expect(mockFiscalConfigRepo.save).toHaveBeenCalled();
        });

        it('debe rechazar CUIT con longitud incorrecta', async () => {
            const dto = { cuit: '123456789' }; // 9 dígitos

            await expect(service.updateEmitterData(dto)).rejects.toThrow(BadRequestException);
        });

        it('debe rechazar CUIT con dígito verificador incorrecto', async () => {
            const dto = { cuit: '20123456780' }; // Último dígito inválido

            await expect(service.updateEmitterData(dto)).rejects.toThrow(BadRequestException);
        });

        it('debe rechazar CUIT con tipo inválido', async () => {
            const dto = { cuit: '99123456781' }; // Tipo 99 inválido

            await expect(service.updateEmitterData(dto)).rejects.toThrow(BadRequestException);
        });

        it('debe parsear fecha de inicio de actividades manualmente', async () => {
            const dto = { activityStartDate: '2025-12-14' };
            await service.updateEmitterData(dto);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            // La fecha debe ser el 14, no el 13 (problema de zona horaria)
            expect(savedConfig.activityStartDate.getDate()).toBe(14);
            expect(savedConfig.activityStartDate.getMonth()).toBe(11); // Diciembre (0-indexed)
            expect(savedConfig.activityStartDate.getFullYear()).toBe(2025);
        });

        it('debe actualizar isConfigured cuando hay campos mínimos', async () => {
            const configWithoutFields = createMockFiscalConfig({
                businessName: null,
                cuit: null,
                businessAddress: null,
                isConfigured: false,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([configWithoutFields]);

            await service.updateEmitterData({
                businessName: 'Empresa',
                cuit: '20012345675',
                businessAddress: 'Dirección',
            });

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.isConfigured).toBe(true);
        });
    });

    describe('setEnvironment()', () => {
        it('debe cambiar entorno a homologacion', async () => {
            const config = createMockFiscalConfig();
            mockFiscalConfigRepo.find.mockResolvedValue([config]);
            mockFiscalConfigRepo.save.mockResolvedValue(config);

            await service.setEnvironment(AfipEnvironment.HOMOLOGACION);

            expect(mockFiscalConfigRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ afipEnvironment: AfipEnvironment.HOMOLOGACION })
            );
        });

        it('debe cambiar entorno a produccion', async () => {
            const config = createMockFiscalConfig();
            mockFiscalConfigRepo.find.mockResolvedValue([config]);
            mockFiscalConfigRepo.save.mockResolvedValue(config);

            await service.setEnvironment(AfipEnvironment.PRODUCCION);

            expect(mockFiscalConfigRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ afipEnvironment: AfipEnvironment.PRODUCCION })
            );
        });
    });

    describe('uploadCertificates()', () => {
        const mockConfig = createMockFiscalConfig();
        const mockCertificate = Buffer.from('-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----').toString('base64');
        const mockPrivateKey = Buffer.from('-----BEGIN PRIVATE KEY-----\nMIIB...\n-----END PRIVATE KEY-----').toString('base64');

        beforeEach(() => {
            mockFiscalConfigRepo.find.mockResolvedValue([mockConfig]);
            mockFiscalConfigRepo.save.mockResolvedValue(mockConfig);
            mockEncryptionService.generateFingerprint.mockReturnValue('sha256-fingerprint');
        });

        it('debe guardar certificados de homologacion', async () => {
            const dto = {
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: mockCertificate,
                privateKey: mockPrivateKey,
                expiresAt: '2026-12-31',
            };

            await service.uploadCertificates(dto);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.homologacionCertificate).toContain('BEGIN CERTIFICATE');
            expect(savedConfig.homologacionPrivateKey).toContain('BEGIN');
            expect(savedConfig.homologacionReady).toBe(true);
        });

        it('debe guardar certificados de produccion', async () => {
            const dto = {
                environment: AfipEnvironment.PRODUCCION,
                certificate: mockCertificate,
                privateKey: mockPrivateKey,
            };

            await service.uploadCertificates(dto);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.produccionCertificate).toContain('BEGIN CERTIFICATE');
            expect(savedConfig.produccionReady).toBe(true);
        });

        it('debe rechazar certificado sin formato PEM válido', async () => {
            const dto = {
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: Buffer.from('not-a-certificate').toString('base64'),
                privateKey: mockPrivateKey,
            };

            await expect(service.uploadCertificates(dto)).rejects.toThrow(BadRequestException);
        });

        it('debe rechazar clave privada sin formato válido', async () => {
            const dto = {
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: mockCertificate,
                privateKey: Buffer.from('not-a-key').toString('base64'),
            };

            await expect(service.uploadCertificates(dto)).rejects.toThrow(BadRequestException);
        });

        it('debe generar fingerprint del certificado', async () => {
            const dto = {
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: mockCertificate,
                privateKey: mockPrivateKey,
            };

            await service.uploadCertificates(dto);

            expect(mockEncryptionService.generateFingerprint).toHaveBeenCalled();
            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.homologacionFingerprint).toBe('sha256-fingerprint');
        });
    });

    describe('deleteCertificates()', () => {
        const mockConfig = createMockFiscalConfig({
            homologacionCertificate: 'cert-homologacion',
            homologacionPrivateKey: 'key-homologacion',
            homologacionReady: true,
            produccionCertificate: 'cert-produccion',
            produccionPrivateKey: 'key-produccion',
            produccionReady: true,
        });

        beforeEach(() => {
            mockFiscalConfigRepo.find.mockResolvedValue([mockConfig]);
            mockFiscalConfigRepo.save.mockResolvedValue(mockConfig);
        });

        it('debe eliminar certificados de homologacion', async () => {
            await service.deleteCertificates(AfipEnvironment.HOMOLOGACION);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.homologacionCertificate).toBeNull();
            expect(savedConfig.homologacionPrivateKey).toBeNull();
            expect(savedConfig.homologacionUploadedAt).toBeNull();
            expect(savedConfig.homologacionExpiresAt).toBeNull();
            expect(savedConfig.homologacionFingerprint).toBeNull();
            expect(savedConfig.homologacionReady).toBe(false);
        });

        it('debe eliminar certificados de produccion', async () => {
            await service.deleteCertificates(AfipEnvironment.PRODUCCION);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.produccionCertificate).toBeNull();
            expect(savedConfig.produccionPrivateKey).toBeNull();
            expect(savedConfig.produccionReady).toBe(false);
        });

        it('no debe afectar certificados del otro entorno', async () => {
            // Mockear find para retornar la configuración actual con ambos certificados
            const configWithBoth = createMockFiscalConfig({
                homologacionCertificate: 'cert-homologacion',
                homologacionPrivateKey: 'key-homologacion',
                homologacionReady: true,
                produccionCertificate: 'cert-produccion',
                produccionPrivateKey: 'key-produccion',
                produccionReady: true,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([configWithBoth]);
            mockFiscalConfigRepo.save.mockImplementation((config) => Promise.resolve(config));

            await service.deleteCertificates(AfipEnvironment.HOMOLOGACION);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.produccionCertificate).toBe('cert-produccion');
            expect(savedConfig.produccionReady).toBe(true);
        });
    });

    describe('getDecryptedCertificates()', () => {
        it('debe retornar certificados de homologacion cuando están disponibles', async () => {
            const config = createMockFiscalConfig({
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
                homologacionCertificate: 'cert-content',
                homologacionPrivateKey: 'key-content',
                homologacionExpiresAt: new Date(Date.now() + 86400000), // Mañana
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getDecryptedCertificates();

            expect(result).toEqual({
                certificate: 'cert-content',
                privateKey: 'key-content',
            });
        });

        it('debe retornar certificados de produccion cuando están disponibles', async () => {
            const config = createMockFiscalConfig({
                afipEnvironment: AfipEnvironment.PRODUCCION,
                produccionCertificate: 'cert-prod',
                produccionPrivateKey: 'key-prod',
                produccionExpiresAt: new Date(Date.now() + 86400000),
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getDecryptedCertificates();

            expect(result).toEqual({
                certificate: 'cert-prod',
                privateKey: 'key-prod',
            });
        });

        it('debe retornar null si no hay certificados', async () => {
            const config = createMockFiscalConfig({
                homologacionCertificate: null,
                homologacionPrivateKey: null,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getDecryptedCertificates();

            expect(result).toBeNull();
        });

        it('debe lanzar error si certificado está vencido', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10);

            const config = createMockFiscalConfig({
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
                homologacionCertificate: 'cert',
                homologacionPrivateKey: 'key',
                homologacionExpiresAt: pastDate,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            await expect(service.getDecryptedCertificates()).rejects.toThrow('ha vencido');
        });
    });

    describe('getCertificateExpirationStatus()', () => {
        it('debe retornar status expired cuando certificado venció', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 5);

            const config = createMockFiscalConfig({
                homologacionExpiresAt: pastDate,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getCertificateExpirationStatus();

            expect(result.homologacion.status).toBe('expired');
            expect(result.homologacion.daysLeft).toBeLessThanOrEqual(0);
        });

        it('debe retornar status critical cuando vence en ≤7 días', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);

            const config = createMockFiscalConfig({
                homologacionExpiresAt: futureDate,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getCertificateExpirationStatus();

            expect(result.homologacion.status).toBe('critical');
            expect(result.homologacion.daysLeft).toBe(5);
        });

        it('debe retornar status warning cuando vence en ≤30 días', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 15);

            const config = createMockFiscalConfig({
                homologacionExpiresAt: futureDate,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getCertificateExpirationStatus();

            expect(result.homologacion.status).toBe('warning');
            expect(result.homologacion.daysLeft).toBe(15);
        });

        it('debe retornar status ok cuando vence en >30 días', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 60);

            const config = createMockFiscalConfig({
                homologacionExpiresAt: futureDate,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getCertificateExpirationStatus();

            expect(result.homologacion.status).toBe('ok');
            expect(result.homologacion.daysLeft).toBe(60);
        });

        it('debe retornar status unknown cuando no hay fecha de expiración', async () => {
            const config = createMockFiscalConfig({
                homologacionExpiresAt: null,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.getCertificateExpirationStatus();

            expect(result.homologacion.status).toBe('unknown');
            expect(result.homologacion.daysLeft).toBeNull();
        });
    });

    describe('isReadyForInvoicing()', () => {
        it('debe retornar ready true cuando todo está configurado', async () => {
            const config = createMockFiscalConfig({
                isConfigured: true,
                homologacionReady: true,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.isReadyForInvoicing();

            expect(result.ready).toBe(true);
            expect(result.missingFields).toEqual([]);
        });

        it('debe retornar ready false con campos faltantes', async () => {
            const config = createMockFiscalConfig({
                isConfigured: true,
                homologacionReady: false,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.isReadyForInvoicing();

            expect(result.ready).toBe(false);
            expect(result.missingFields).toContain('certificados_homologacion');
        });

        it('debe detectar campos específicos faltantes', async () => {
            const config = createMockFiscalConfig({
                businessName: null,
                cuit: null,
                businessAddress: null,
                homologacionReady: true,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.isReadyForInvoicing();

            expect(result.missingFields).toContain('businessName');
            expect(result.missingFields).toContain('cuit');
            expect(result.missingFields).toContain('businessAddress');
        });
    });

    describe('testAfipConnection()', () => {
        it('debe retornar conexión exitosa cuando todo está configurado', async () => {
            const config = createMockFiscalConfig({
                isConfigured: true,
                homologacionReady: true,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.testAfipConnection();

            expect(result.configured).toBe(true);
            expect(result.certificatesReady).toBe(true);
            expect(result.connection.success).toBe(true);
            expect(result.connection.message).toContain('Modo simulación activo');
        });

        it('debe retornar error de configuración incompleta', async () => {
            const config = createMockFiscalConfig({
                isConfigured: false,
                homologacionReady: true,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.testAfipConnection();

            expect(result.connection.success).toBe(false);
            expect(result.connection.message).toContain('incompleta');
        });

        it('debe retornar error de certificados no configurados', async () => {
            const config = createMockFiscalConfig({
                isConfigured: true,
                homologacionReady: false,
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([config]);

            const result = await service.testAfipConnection();

            expect(result.connection.success).toBe(false);
            expect(result.connection.message).toContain('Certificados no configurados');
        });
    });

    describe('WSAA Token Management - Homologación', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        const configWithToken = createMockFiscalConfig({
            afipEnvironment: AfipEnvironment.HOMOLOGACION,
            wsaaTokenHomologacion: 'test-token-homologacion',
            wsaaSignHomologacion: 'test-sign-homologacion',
            wsaaTokenExpirationHomologacion: futureDate,
        });

        beforeEach(() => {
            mockFiscalConfigRepo.find.mockResolvedValue([configWithToken]);
            mockFiscalConfigRepo.save.mockResolvedValue(configWithToken);
        });

        it('getStoredWsaaToken() debe retornar token válido de homologacion', async () => {
            const result = await service.getStoredWsaaToken();

            expect(result).not.toBeNull();
            expect(result?.token).toBe('test-token-homologacion');
            expect(result?.sign).toBe('test-sign-homologacion');
        });

        it('getStoredWsaaToken() debe retornar null si token está expirado', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10);

            const configExpired = createMockFiscalConfig({
                afipEnvironment: AfipEnvironment.HOMOLOGACION,
                wsaaTokenHomologacion: 'expired-token',
                wsaaSignHomologacion: 'expired-sign',
                wsaaTokenExpirationHomologacion: pastDate,
            });
            mockFiscalConfigRepo.find.mockResolvedValue([configExpired]);

            const result = await service.getStoredWsaaToken();

            expect(result).toBeNull();
        });

        it('saveWsaaToken() debe guardar token en campos de homologacion', async () => {
            const expiration = new Date('2026-12-31');

            await service.saveWsaaToken('new-token', 'new-sign', expiration);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.wsaaTokenHomologacion).toBe('new-token');
            expect(savedConfig.wsaaSignHomologacion).toBe('new-sign');
            expect(savedConfig.wsaaTokenExpirationHomologacion).toBe(expiration);
        });

        it('clearWsaaToken() debe limpiar token de homologacion', async () => {
            await service.clearWsaaToken();

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.wsaaTokenHomologacion).toBeNull();
            expect(savedConfig.wsaaSignHomologacion).toBeNull();
            expect(savedConfig.wsaaTokenExpirationHomologacion).toBeNull();
        });
    });

    describe('WSAA Token Management - Producción', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        const configWithToken = createMockFiscalConfig({
            afipEnvironment: AfipEnvironment.PRODUCCION,
            wsaaTokenProduccion: 'test-token-produccion',
            wsaaSignProduccion: 'test-sign-produccion',
            wsaaTokenExpirationProduccion: futureDate,
        });

        beforeEach(() => {
            mockFiscalConfigRepo.find.mockResolvedValue([configWithToken]);
            mockFiscalConfigRepo.save.mockResolvedValue(configWithToken);
        });

        it('getStoredWsaaToken() debe retornar token válido de produccion', async () => {
            const result = await service.getStoredWsaaToken();

            expect(result).not.toBeNull();
            expect(result?.token).toBe('test-token-produccion');
            expect(result?.sign).toBe('test-sign-produccion');
        });

        it('saveWsaaToken() debe guardar token en campos de produccion', async () => {
            const expiration = new Date('2026-12-31');

            await service.saveWsaaToken('new-token', 'new-sign', expiration);

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.wsaaTokenProduccion).toBe('new-token');
            expect(savedConfig.wsaaSignProduccion).toBe('new-sign');
            expect(savedConfig.wsaaTokenExpirationProduccion).toBe(expiration);
        });

        it('clearWsaaToken() debe limpiar token de produccion', async () => {
            await service.clearWsaaToken();

            const savedConfig = mockFiscalConfigRepo.save.mock.calls[0][0];
            expect(savedConfig.wsaaTokenProduccion).toBeNull();
            expect(savedConfig.wsaaSignProduccion).toBeNull();
            expect(savedConfig.wsaaTokenExpirationProduccion).toBeNull();
        });
    });
});
