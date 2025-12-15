/**
 * Servicio de cifrado de certificados AFIP
 * Cifra y descifra certificados usando AES-256-GCM
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

@Injectable()
export class CertificateEncryptionService {
    private readonly logger = new Logger(CertificateEncryptionService.name);
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer | null;

    constructor(private readonly configService: ConfigService) {
        const keyBase64 = this.configService.get<string>('AFIP_ENCRYPTION_KEY');
        
        if (keyBase64) {
            try {
                this.key = Buffer.from(keyBase64, 'base64');
                if (this.key.length !== 32) {
                    this.logger.warn('AFIP_ENCRYPTION_KEY debe ser de 32 bytes (256 bits)');
                    this.key = null;
                }
            } catch {
                this.logger.warn('AFIP_ENCRYPTION_KEY no es un Base64 válido');
                this.key = null;
            }
        } else {
            this.logger.warn('AFIP_ENCRYPTION_KEY no configurada. Cifrado de certificados deshabilitado.');
            this.key = null;
        }
    }

    /**
     * Verifica si el servicio está configurado correctamente
     */
    isConfigured(): boolean {
        return this.key !== null;
    }

    /**
     * Cifra el contenido del certificado antes de guardarlo en DB
     * @param plainText - Contenido del certificado en texto plano
     * @returns Contenido cifrado en formato iv:authTag:encryptedData (Base64)
     */
    encrypt(plainText: string): string {
        if (!this.key) {
            throw new Error('Servicio de cifrado no configurado');
        }

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(plainText, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // Formato: iv:authTag:encryptedData (completo en Base64)
        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    }

    /**
     * Descifra el contenido del certificado para usarlo
     * @param encryptedData - Contenido cifrado en formato iv:authTag:encryptedData
     * @returns Contenido descifrado en texto plano
     */
    decrypt(encryptedData: string): string {
        if (!this.key) {
            throw new Error('Servicio de cifrado no configurado');
        }

        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Formato de datos cifrados inválido');
        }

        const [ivBase64, authTagBase64, encrypted] = parts;

        const iv = Buffer.from(ivBase64, 'base64');
        const authTag = Buffer.from(authTagBase64, 'base64');

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Genera un fingerprint SHA-256 del certificado
     * @param content - Contenido del certificado
     * @returns Hash SHA-256 en hexadecimal
     */
    generateFingerprint(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}

