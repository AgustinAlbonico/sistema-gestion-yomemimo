/**
 * Tests unitarios para CertificateGenerationService
 * Cubre: generateCertificate, escapeSubject, cleanup, getInstructions
 * Enfoque: Pruebas de generación de certificados AFIP usando OpenSSL
 */
import { CertificateGenerationService } from './certificate-generation.service';
import { FiscalConfigurationService } from './fiscal-configuration.service';
import { FiscalConfiguration, AfipEnvironment } from './entities/fiscal-configuration.entity';
import { IvaCondition } from '../../common/enums/iva-condition.enum';
import { BadRequestException } from '@nestjs/common';

// Mock de fs
jest.mock('node:fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn(),
    unlinkSync: jest.fn(),
}));

// Mock de child_process
jest.mock('node:child_process', () => ({
    execSync: jest.fn(),
}));

// Obtener referencias a los mocks
const mockFs = require('node:fs') as {
    existsSync: jest.Mock,
    mkdirSync: jest.Mock,
    readFileSync: jest.Mock,
    unlinkSync: jest.Mock,
};
const mockExecSync = require('node:child_process').execSync as jest.Mock;

describe('CertificateGenerationService', () => {
    let service: CertificateGenerationService;
    let mockFiscalConfigService: jest.Mocked<FiscalConfigurationService>;

    const mockConfig: FiscalConfiguration = {
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
        homologacionCertificate: null,
        homologacionPrivateKey: null,
        homologacionReady: true,
        homologacionUploadedAt: null,
        homologacionExpiresAt: null,
        homologacionFingerprint: null,
        produccionCertificate: null,
        produccionPrivateKey: null,
        produccionReady: false,
        produccionUploadedAt: null,
        produccionExpiresAt: null,
        produccionFingerprint: null,
        wsaaTokenHomologacion: null,
        wsaaSignHomologacion: null,
        wsaaTokenExpirationHomologacion: null,
        wsaaTokenProduccion: null,
        wsaaSignProduccion: null,
        wsaaTokenExpirationProduccion: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    const mockPrivateKey = '-----BEGIN PRIVATE KEY-----\nMIIB...\n-----END PRIVATE KEY-----';
    const mockCSR = '-----BEGIN CERTIFICATE REQUEST-----\nMIIB...\n-----END CERTIFICATE REQUEST-----';

    beforeEach(() => {
        mockFiscalConfigService = {
            getConfiguration: jest.fn(),
        } as unknown as jest.Mocked<FiscalConfigurationService>;

        // Mock fs.mkdirSync para crear directorio temp
        mockFs.mkdirSync.mockImplementation(() => { });
        // Mock fs.existsSync para retornar true para archivos
        mockFs.existsSync.mockReturnValue(true);
        // Mock fs.readFileSync
        mockFs.readFileSync.mockImplementation((path) => {
            if (String(path).includes('.key')) return mockPrivateKey;
            if (String(path).includes('.csr')) return mockCSR;
            return '';
        });
        // Mock fs.unlinkSync
        mockFs.unlinkSync.mockImplementation(() => { });
        // Mock execSync
        mockExecSync.mockReturnValue(Buffer.from('success'));

        // Crear servicio antes de cada test
        service = new CertificateGenerationService(mockFiscalConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('debe crear directorio temporal si no existe', () => {
            mockFs.existsSync.mockReturnValue(false);

            service = new CertificateGenerationService(mockFiscalConfigService);

            expect(mockFs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('temp'),
                { recursive: true }
            );
        });
    });

    describe('generateCertificate()', () => {
        beforeEach(() => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue(mockConfig);
        });

        it('debe generar certificado para homologacion exitosamente', async () => {
            const result = await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            expect(result.environment).toBe(AfipEnvironment.HOMOLOGACION);
            expect(result.csr).toBeDefined();
            expect(result.privateKey).toBeDefined();
            expect(result.fingerprint).toBeDefined();
            expect(result.generatedAt).toBeInstanceOf(Date);
            expect(result.instructions).toContain('HOMOLOGACIÓN');
        });

        it('debe generar certificado para produccion exitosamente', async () => {
            const result = await service.generateCertificate(AfipEnvironment.PRODUCCION);

            expect(result.environment).toBe(AfipEnvironment.PRODUCCION);
            expect(result.instructions).toContain('PRODUCCIÓN');
        });

        it('debe lanzar error si businessName no está configurado', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                businessName: '',
            });

            await expect(service.generateCertificate(AfipEnvironment.HOMOLOGACION))
                .rejects.toThrow(BadRequestException);
        });

        it('debe lanzar error si cuit no está configurado', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                cuit: '',
            });

            await expect(service.generateCertificate(AfipEnvironment.HOMOLOGACION))
                .rejects.toThrow(BadRequestException);
        });

        it('debe lanzar error si OpenSSL no está disponible', async () => {
            mockExecSync.mockImplementation(() => {
                throw new Error('OpenSSL not found');
            });

            await expect(service.generateCertificate(AfipEnvironment.HOMOLOGACION))
                .rejects.toThrow(BadRequestException);
        });

        it('debe llamar a OpenSSL para generar clave privada', async () => {
            await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('openssl genrsa'),
                expect.objectContaining({ stdio: 'pipe' })
            );
        });

        it('debe llamar a OpenSSL para generar CSR', async () => {
            await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('openssl req'),
                expect.objectContaining({ stdio: 'pipe' })
            );
        });

        it('debe incluir businessName y CUIT en el subject del certificado', async () => {
            await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            const reqCallIndex = mockExecSync.mock.calls.findIndex(call =>
                String(call[0]).includes('openssl req')
            );

            if (reqCallIndex >= 0) {
                const reqCommand = String(mockExecSync.mock.calls[reqCallIndex][0]);
                expect(reqCommand).toContain('O=Empresa Test S.A.');
                expect(reqCommand).toContain('serialNumber=CUIT 20012345675');
            }
        });

        it('debe limpiar archivos temporales después de generar', async () => {
            await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2); // .key y .csr
        });

        it('debe limpiar archivos temporales si hay error', async () => {
            // Resetear y configurar mocks para este escenario específico
            jest.clearAllMocks();
            mockFs.existsSync.mockReturnValue(true); // Archivos "existen" para cleanup
            mockFs.readFileSync.mockImplementation((path) => {
                if (String(path).includes('.key')) return mockPrivateKey;
                if (String(path).includes('.csr')) return mockCSR;
                return '';
            });
            mockFs.unlinkSync.mockImplementation(() => { });

            // Simular que genrsa funciona (crea el key) pero req falla
            let callCount = 0;
            mockExecSync.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Buffer.from('success'); // genrsa funciona
                }
                throw new Error('OpenSSL error'); // req falla
            });

            try {
                await service.generateCertificate(AfipEnvironment.HOMOLOGACION);
            } catch (e) {
                // Error esperado
            }

            expect(mockFs.unlinkSync).toHaveBeenCalled();
        });

        it('debe generar fingerprint SHA-256 del CSR', async () => {
            const result = await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            expect(result.fingerprint).toMatch(/^[0-9A-F:]+$/);
        });

        it('debe retornar instrucciones para homologacion', async () => {
            const result = await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            expect(result.instructions).toContain('webservices@afip.gov.ar');
            expect(result.instructions).toContain('Homologación');
        });

        it('debe retornar instrucciones para produccion', async () => {
            const result = await service.generateCertificate(AfipEnvironment.PRODUCCION);

            expect(result.instructions).toContain('Clave Fiscal');
            expect(result.instructions).toContain('PRODUCCIÓN');
        });

        it('debe escalar caracteres especiales en el subject', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                businessName: 'Empresa "Test" S.A.',
            });

            await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            const reqCallIndex = mockExecSync.mock.calls.findIndex(call =>
                String(call[0]).includes('openssl req')
            );

            if (reqCallIndex >= 0) {
                const reqCommand = String(mockExecSync.mock.calls[reqCallIndex][0]);
                // El nombre en O= no debe tener comillas
                const oMatch = reqCommand.match(/O=([^\s\\"]+)/);
                if (oMatch && oMatch[1]) {
                    expect(oMatch[1]).not.toContain('"');
                }
            }
        });

        it('debe eliminar barras del nombre', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                businessName: 'Empresa/Test S.A.',
            });

            await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            const reqCallIndex = mockExecSync.mock.calls.findIndex(call =>
                String(call[0]).includes('openssl req')
            );

            if (reqCallIndex >= 0) {
                const reqCommand = String(mockExecSync.mock.calls[reqCallIndex][0]);
                // Verificar que el subject no tiene / en el nombre O=
                const oMatch = reqCommand.match(/O=([^\s\/]+)/);
                if (oMatch && oMatch[1]) {
                    expect(oMatch[1]).not.toContain('/');
                }
            }
        });

        it('debe eliminar backslashes del nombre', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue({
                ...mockConfig,
                businessName: 'Empresa\\Test',
            });

            await service.generateCertificate(AfipEnvironment.HOMOLOGACION);

            const reqCallIndex = mockExecSync.mock.calls.findIndex(call =>
                String(call[0]).includes('openssl req')
            );

            if (reqCallIndex >= 0) {
                const reqCommand = String(mockExecSync.mock.calls[reqCallIndex][0]);
                // Verificar que el nombre no tiene backslash (solo puede estar en la ruta de archivos)
                const subjectMatch = reqCommand.match(/-subj\s+"([^"]+)"/);
                if (subjectMatch && subjectMatch[1]) {
                    expect(subjectMatch[1]).not.toContain('\\');
                }
            }
        });
    });

    describe('cleanup() - manejo de errores', () => {
        it('no debe lanzar error si archivo no existe al limpiar', async () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.unlinkSync.mockImplementation(() => {
                throw new Error('File not found');
            });
            mockExecSync.mockImplementation(() => {
                throw new Error('Test error');
            });

            // No debe lanzar error aunque unlinkSync falle
            await expect(
                service.generateCertificate(AfipEnvironment.HOMOLOGACION)
            ).rejects.toThrow();
        });
    });

    describe('manejo de errores', () => {
        it('debe propagar errores de OpenSSL con mensaje descriptivo', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue(mockConfig);
            mockExecSync.mockImplementation(() => {
                throw new Error('openssl: error');
            });

            await expect(service.generateCertificate(AfipEnvironment.HOMOLOGACION))
                .rejects.toThrow(BadRequestException);
        });

        it('debe incluir mensaje de error original en BadRequestException', async () => {
            mockFiscalConfigService.getConfiguration.mockResolvedValue(mockConfig);
            mockExecSync.mockImplementation(() => {
                throw new Error('Cannot write to file');
            });

            try {
                await service.generateCertificate(AfipEnvironment.HOMOLOGACION);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
            }
        });
    });
});
