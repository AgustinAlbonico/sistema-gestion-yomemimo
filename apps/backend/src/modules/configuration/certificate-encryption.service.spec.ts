/**
 * Tests unitarios para CertificateEncryptionService
 * Cubre: isConfigured, encrypt, decrypt, generateFingerprint
 * Enfoque: Pruebas de cifrado/descifrado AES-256-GCM
 */
import { CertificateEncryptionService } from './certificate-encryption.service';
import { ConfigService } from '@nestjs/config';

describe('CertificateEncryptionService', () => {
    let service: CertificateEncryptionService;
    let mockConfigService: jest.Mocked<ConfigService>;

    // Clave de 32 bytes (256 bits) en Base64 para tests
    const validKeyBase64 = Buffer.alloc(32, 'a').toString('base64');
    const invalidKeyBase64 = Buffer.alloc(16, 'b').toString('base64'); // 16 bytes - inválido

    beforeEach(() => {
        mockConfigService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;
    });

    describe('con clave válida de 32 bytes', () => {
        beforeEach(() => {
            mockConfigService.get.mockReturnValue(validKeyBase64);
            service = new CertificateEncryptionService(mockConfigService);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('isConfigured()', () => {
            it('debe retornar true cuando la clave tiene 32 bytes', () => {
                expect(service.isConfigured()).toBe(true);
            });
        });

        describe('encrypt()', () => {
            it('debe cifrar texto correctamente', () => {
                const plainText = 'Este es un certificado de prueba';
                const encrypted = service.encrypt(plainText);

                expect(encrypted).not.toBe(plainText);
                expect(encrypted).toContain(':'); // Formato: iv:authTag:encrypted
            });

            it('debe generar diferentes cifrados para el mismo texto (IV aleatorio)', () => {
                const plainText = 'Certificado de prueba';
                const encrypted1 = service.encrypt(plainText);
                const encrypted2 = service.encrypt(plainText);

                expect(encrypted1).not.toBe(encrypted2);
            });

            it('debe retornar formato con 3 partes separadas por dos puntos', () => {
                const plainText = 'Texto de prueba';
                const encrypted = service.encrypt(plainText);
                const parts = encrypted.split(':');

                expect(parts).toHaveLength(3);
            });

            it('debe cifrar texto largo correctamente', () => {
                const longText = 'A'.repeat(10000);
                const encrypted = service.encrypt(longText);

                expect(encrypted.split(':')).toHaveLength(3);
            });
        });

        describe('decrypt()', () => {
            it('debe descifrar datos cifrados correctamente', () => {
                const plainText = 'Certificado AFIP de prueba';
                const encrypted = service.encrypt(plainText);
                const decrypted = service.decrypt(encrypted);

                expect(decrypted).toBe(plainText);
            });

            it('debe descifrar texto con caracteres especiales', () => {
                const plainText = '-----BEGIN CERTIFICATE-----\nMIIB...certificado...==\n-----END CERTIFICATE-----';
                const encrypted = service.encrypt(plainText);
                const decrypted = service.decrypt(encrypted);

                expect(decrypted).toBe(plainText);
            });

            it('debe lanzar error si formato de datos cifrados es inválido', () => {
                const invalidData = 'formato-invalido';

                expect(() => service.decrypt(invalidData)).toThrow('Formato de datos cifrados inválido');
            });

            it('debe lanzar error si faltan partes del formato', () => {
                const invalidData = 'parte1:parte2'; // Solo 2 partes

                expect(() => service.decrypt(invalidData)).toThrow('Formato de datos cifrados inválido');
            });

            it('debe lanzar error si los datos están corruptos', () => {
                const corruptData = Buffer.from('invalid-base64-not-real').toString('base64');
                const encrypted = `abc123:def456:${corruptData}`;

                expect(() => service.decrypt(encrypted)).toThrow();
            });
        });

        describe('generateFingerprint()', () => {
            it('debe generar hash SHA-256 en hexadecimal', () => {
                const content = 'Certificado de prueba';
                const fingerprint = service.generateFingerprint(content);

                expect(typeof fingerprint).toBe('string');
                expect(fingerprint).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 caracteres hex
            });

            it('debe generar el mismo hash para el mismo contenido', () => {
                const content = 'Contenido idéntico';
                const fingerprint1 = service.generateFingerprint(content);
                const fingerprint2 = service.generateFingerprint(content);

                expect(fingerprint1).toBe(fingerprint2);
            });

            it('debe generar hashes diferentes para contenidos diferentes', () => {
                const fingerprint1 = service.generateFingerprint('Contenido A');
                const fingerprint2 = service.generateFingerprint('Contenido B');

                expect(fingerprint1).not.toBe(fingerprint2);
            });

            it('debe generar hash de longitud fija 64 caracteres', () => {
                const fingerprint = service.generateFingerprint('Cualquier contenido');

                expect(fingerprint.length).toBe(64);
            });
        });

        describe('integración encrypt/decrypt', () => {
            it('debe cifrar y descifrar correctamente un certificado PEM simulado', () => {
                const mockCert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKqzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
-----END CERTIFICATE-----`;

                const encrypted = service.encrypt(mockCert);
                const decrypted = service.decrypt(encrypted);

                expect(decrypted).toBe(mockCert);
            });
        });
    });

    describe('con clave inválida o sin configurar', () => {
        beforeEach(() => {
            mockConfigService.get.mockReturnValue(invalidKeyBase64);
            service = new CertificateEncryptionService(mockConfigService);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('isConfigured()', () => {
            it('debe retornar false cuando la clave no tiene 32 bytes', () => {
                expect(service.isConfigured()).toBe(false);
            });
        });

        describe('encrypt()', () => {
            it('debe lanzar error cuando el servicio no está configurado', () => {
                expect(() => service.encrypt('texto')).toThrow('Servicio de cifrado no configurado');
            });
        });

        describe('decrypt()', () => {
            it('debe lanzar error cuando el servicio no está configurado', () => {
                expect(() => service.decrypt('texto:cifrado')).toThrow('Servicio de cifrado no configurado');
            });
        });
    });

    describe('sin clave de configuración', () => {
        beforeEach(() => {
            mockConfigService.get.mockReturnValue(undefined);
            service = new CertificateEncryptionService(mockConfigService);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('isConfigured()', () => {
            it('debe retornar false cuando no hay clave configurada', () => {
                expect(service.isConfigured()).toBe(false);
            });
        });

        describe('encrypt()', () => {
            it('debe lanzar error cuando no hay clave configurada', () => {
                expect(() => service.encrypt('texto')).toThrow('Servicio de cifrado no configurado');
            });
        });
    });

    describe('con Base64 inválido', () => {
        beforeEach(() => {
            mockConfigService.get.mockReturnValue('esto-no-es-base64-válido!!!');
            service = new CertificateEncryptionService(mockConfigService);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('isConfigured()', () => {
            it('debe retornar false cuando Base64 es inválido', () => {
                expect(service.isConfigured()).toBe(false);
            });
        });
    });
});
