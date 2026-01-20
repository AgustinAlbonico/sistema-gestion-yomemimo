/**
 * Tests unitarios para FiscalConfigurationController
 * Cubre: todos los endpoints del controlador fiscal
 * Enfoque: Pruebas de delegación a servicios
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FiscalConfigurationController } from './fiscal-configuration.controller';
import { FiscalConfigurationService } from './fiscal-configuration.service';
import { CertificateGenerationService } from './certificate-generation.service';
import { AfipEnvironment } from './entities/fiscal-configuration.entity';
import {
    UpdateEmitterDataDto,
    UpdateAfipEnvironmentDto,
    UploadCertificatesDto,
    FiscalConfigurationResponseDto,
    AfipConnectionStatusDto,
} from './dto/fiscal-configuration.dto';
import { GenerateCertificateResponseDto } from './dto/generate-certificates.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IvaCondition } from '../../common/enums/iva-condition.enum';

describe('FiscalConfigurationController', () => {
    let controller: FiscalConfigurationController;
    let mockFiscalConfigService: jest.Mocked<FiscalConfigurationService>;
    let mockCertificateGenService: jest.Mocked<CertificateGenerationService>;

    const mockPublicConfig: FiscalConfigurationResponseDto = {
        id: 'fiscal-uuid',
        businessName: 'Empresa Test S.A.',
        cuit: '20012345675',
        grossIncome: '123456789',
        activityStartDate: new Date('2020-01-01'),
        businessAddress: 'Calle Falsa 123',
        ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        pointOfSale: 1,
        afipEnvironment: AfipEnvironment.HOMOLOGACION,
        isConfigured: true,
        homologacionReady: false,
        produccionReady: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        // Campos sensibles omitidos (certificados, tokens)
    };

    beforeEach(async () => {
        mockFiscalConfigService = {
            getPublicConfiguration: jest.fn(),
            updateEmitterData: jest.fn(),
            setEnvironment: jest.fn(),
            uploadCertificates: jest.fn(),
            deleteCertificates: jest.fn(),
            isReadyForInvoicing: jest.fn(),
            testAfipConnection: jest.fn(),
        } as unknown as jest.Mocked<FiscalConfigurationService>;

        mockCertificateGenService = {
            generateCertificate: jest.fn(),
        } as unknown as jest.Mocked<CertificateGenerationService>;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FiscalConfigurationController],
            providers: [
                { provide: FiscalConfigurationService, useValue: mockFiscalConfigService },
                { provide: CertificateGenerationService, useValue: mockCertificateGenService },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<FiscalConfigurationController>(FiscalConfigurationController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getConfiguration()', () => {
        it('debe retornar configuración pública', async () => {
            mockFiscalConfigService.getPublicConfiguration.mockResolvedValue(mockPublicConfig);

            const result = await controller.getConfiguration();

            expect(mockFiscalConfigService.getPublicConfiguration).toHaveBeenCalled();
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe propagar errores del servicio', async () => {
            const error = new Error('Database error');
            mockFiscalConfigService.getPublicConfiguration.mockRejectedValue(error);

            await expect(controller.getConfiguration()).rejects.toThrow(error);
        });
    });

    describe('updateEmitterData()', () => {
        it('debe llamar al servicio con el DTO', async () => {
            const dto: UpdateEmitterDataDto = {
                businessName: 'Nueva Empresa S.A.',
                cuit: '20987654321',
                grossIncome: '987654321',
                activityStartDate: '2021-01-01',
                businessAddress: 'Otra Calle 456',
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                pointOfSale: 2,
            };

            mockFiscalConfigService.updateEmitterData.mockResolvedValue(mockPublicConfig);

            const result = await controller.updateEmitterData(dto);

            expect(mockFiscalConfigService.updateEmitterData).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe propagar errores del servicio', async () => {
            const dto: UpdateEmitterDataDto = {
                businessName: 'Empresa S.A.',
                cuit: '20012345675',
                grossIncome: '123456789',
                activityStartDate: '2020-01-01',
                businessAddress: 'Calle 123',
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                pointOfSale: 1,
            };

            const error = new Error('Invalid CUIT');
            mockFiscalConfigService.updateEmitterData.mockRejectedValue(error);

            await expect(controller.updateEmitterData(dto)).rejects.toThrow(error);
        });
    });

    describe('setEnvironment()', () => {
        it('debe cambiar el entorno a homologación', async () => {
            const dto: UpdateAfipEnvironmentDto = {
                environment: AfipEnvironment.HOMOLOGACION,
            };

            mockFiscalConfigService.setEnvironment.mockResolvedValue(mockPublicConfig);

            const result = await controller.setEnvironment(dto);

            expect(mockFiscalConfigService.setEnvironment).toHaveBeenCalledWith(AfipEnvironment.HOMOLOGACION);
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe cambiar el entorno a producción', async () => {
            const dto: UpdateAfipEnvironmentDto = {
                environment: AfipEnvironment.PRODUCCION,
            };

            mockFiscalConfigService.setEnvironment.mockResolvedValue(mockPublicConfig);

            const result = await controller.setEnvironment(dto);

            expect(mockFiscalConfigService.setEnvironment).toHaveBeenCalledWith(AfipEnvironment.PRODUCCION);
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe propagar errores del servicio', async () => {
            const dto: UpdateAfipEnvironmentDto = {
                environment: AfipEnvironment.HOMOLOGACION,
            };

            const error = new Error('Invalid environment');
            mockFiscalConfigService.setEnvironment.mockRejectedValue(error);

            await expect(controller.setEnvironment(dto)).rejects.toThrow(error);
        });
    });

    describe('generateCertificate()', () => {
        it('debe generar certificado para homologación', async () => {
            const dto = { environment: AfipEnvironment.HOMOLOGACION };
            const expectedResponse: GenerateCertificateResponseDto = {
                environment: AfipEnvironment.HOMOLOGACION,
                csr: '-----BEGIN CERTIFICATE REQUEST-----\n...\n-----END CERTIFICATE REQUEST-----',
                privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
                fingerprint: 'AA:BB:CC:DD',
                generatedAt: new Date('2024-01-01'),
                instructions: 'Instrucciones...',
            };

            mockCertificateGenService.generateCertificate.mockResolvedValue(expectedResponse);

            const result = await controller.generateCertificate(dto);

            expect(mockCertificateGenService.generateCertificate).toHaveBeenCalledWith(AfipEnvironment.HOMOLOGACION);
            expect(result).toEqual(expectedResponse);
        });

        it('debe generar certificado para producción', async () => {
            const dto = { environment: AfipEnvironment.PRODUCCION };
            const expectedResponse: GenerateCertificateResponseDto = {
                environment: AfipEnvironment.PRODUCCION,
                csr: '-----BEGIN CERTIFICATE REQUEST-----\n...\n-----END CERTIFICATE REQUEST-----',
                privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
                fingerprint: 'AA:BB:CC:DD',
                generatedAt: new Date('2024-01-01'),
                instructions: 'Instrucciones...',
            };

            mockCertificateGenService.generateCertificate.mockResolvedValue(expectedResponse);

            const result = await controller.generateCertificate(dto);

            expect(mockCertificateGenService.generateCertificate).toHaveBeenCalledWith(AfipEnvironment.PRODUCCION);
            expect(result).toEqual(expectedResponse);
        });

        it('debe propagar errores del servicio', async () => {
            const dto = { environment: AfipEnvironment.HOMOLOGACION };

            const error = new Error('OpenSSL not available');
            mockCertificateGenService.generateCertificate.mockRejectedValue(error);

            await expect(controller.generateCertificate(dto)).rejects.toThrow(error);
        });
    });

    describe('uploadCertificates()', () => {
        it('debe subir certificados para homologación', async () => {
            const dto: UploadCertificatesDto = {
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
                privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
            };

            mockFiscalConfigService.uploadCertificates.mockResolvedValue(mockPublicConfig);

            const result = await controller.uploadCertificates(dto);

            expect(mockFiscalConfigService.uploadCertificates).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe subir certificados para producción', async () => {
            const dto: UploadCertificatesDto = {
                environment: AfipEnvironment.PRODUCCION,
                certificate: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
                privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
            };

            mockFiscalConfigService.uploadCertificates.mockResolvedValue(mockPublicConfig);

            const result = await controller.uploadCertificates(dto);

            expect(mockFiscalConfigService.uploadCertificates).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe propagar errores del servicio', async () => {
            const dto: UploadCertificatesDto = {
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: 'invalid',
                privateKey: 'invalid',
            };

            const error = new Error('Invalid certificate format');
            mockFiscalConfigService.uploadCertificates.mockRejectedValue(error);

            await expect(controller.uploadCertificates(dto)).rejects.toThrow(error);
        });
    });

    describe('deleteCertificates()', () => {
        it('debe eliminar certificados de homologación', async () => {
            mockFiscalConfigService.deleteCertificates.mockResolvedValue(mockPublicConfig);

            const result = await controller.deleteCertificates(AfipEnvironment.HOMOLOGACION);

            expect(mockFiscalConfigService.deleteCertificates).toHaveBeenCalledWith(AfipEnvironment.HOMOLOGACION);
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe eliminar certificados de producción', async () => {
            mockFiscalConfigService.deleteCertificates.mockResolvedValue(mockPublicConfig);

            const result = await controller.deleteCertificates(AfipEnvironment.PRODUCCION);

            expect(mockFiscalConfigService.deleteCertificates).toHaveBeenCalledWith(AfipEnvironment.PRODUCCION);
            expect(result).toEqual(mockPublicConfig);
        });

        it('debe propagar errores del servicio', async () => {
            const error = new Error('Certificates not found');
            mockFiscalConfigService.deleteCertificates.mockRejectedValue(error);

            await expect(controller.deleteCertificates(AfipEnvironment.HOMOLOGACION)).rejects.toThrow(error);
        });
    });

    describe('getStatus()', () => {
        it('debe retornar estado de listo para facturar', async () => {
            const statusResponse = {
                ready: true,
                missingFields: [],
            };

            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue(statusResponse);

            const result = await controller.getStatus();

            expect(mockFiscalConfigService.isReadyForInvoicing).toHaveBeenCalled();
            expect(result).toEqual(statusResponse);
        });

        it('debe retornar estado no listo con campos faltantes', async () => {
            const statusResponse = {
                ready: false,
                missingFields: ['businessName', 'cuit'],
            };

            mockFiscalConfigService.isReadyForInvoicing.mockResolvedValue(statusResponse);

            const result = await controller.getStatus();

            expect(result).toEqual(statusResponse);
            expect(result.ready).toBe(false);
            expect(result.missingFields).toContain('businessName');
        });

        it('debe propagar errores del servicio', async () => {
            const error = new Error('Configuration error');
            mockFiscalConfigService.isReadyForInvoicing.mockRejectedValue(error);

            await expect(controller.getStatus()).rejects.toThrow(error);
        });
    });

    describe('testConnection()', () => {
        it('debe retornar estado de conexión exitosa', async () => {
            const connectionStatus: AfipConnectionStatusDto = {
                configured: true,
                environment: AfipEnvironment.HOMOLOGACION,
                certificatesReady: true,
                connection: {
                    success: true,
                    message: 'Conexión exitosa',
                    testedAt: new Date('2024-01-01'),
                },
            };

            mockFiscalConfigService.testAfipConnection.mockResolvedValue(connectionStatus);

            const result = await controller.testConnection();

            expect(mockFiscalConfigService.testAfipConnection).toHaveBeenCalled();
            expect(result).toEqual(connectionStatus);
            expect(result.connection.success).toBe(true);
        });

        it('debe retornar estado de conexión fallida', async () => {
            const connectionStatus: AfipConnectionStatusDto = {
                configured: true,
                environment: AfipEnvironment.HOMOLOGACION,
                certificatesReady: true,
                connection: {
                    success: false,
                    message: 'Error de conexión',
                    testedAt: new Date('2024-01-01'),
                },
            };

            mockFiscalConfigService.testAfipConnection.mockResolvedValue(connectionStatus);

            const result = await controller.testConnection();

            expect(result.connection.success).toBe(false);
            expect(result.connection.message).toBe('Error de conexión');
        });

        it('debe propagar errores del servicio', async () => {
            const error = new Error('Network error');
            mockFiscalConfigService.testAfipConnection.mockRejectedValue(error);

            await expect(controller.testConnection()).rejects.toThrow(error);
        });
    });

    describe('guards', () => {
        it('debe estar protegido por JwtAuthGuard', () => {
            const guards = Reflect.getMetadata('__guards__', FiscalConfigurationController);
            expect(guards).toBeDefined();
        });
    });
});
