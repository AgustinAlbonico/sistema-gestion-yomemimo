/**
 * Servicio para generar certificados AFIP usando OpenSSL
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AfipEnvironment } from './entities/fiscal-configuration.entity';
import { GenerateCertificateResponseDto } from './dto/generate-certificates.dto';
import { FiscalConfigurationService } from './fiscal-configuration.service';

@Injectable()
export class CertificateGenerationService {
    private readonly logger = new Logger(CertificateGenerationService.name);
    private readonly tempDir = path.join(process.cwd(), 'temp', 'certificates');

    constructor(
        private readonly fiscalConfigService: FiscalConfigurationService,
    ) {
        // Crear directorio temporal si no existe
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Genera un CSR y clave privada para AFIP
     */
    async generateCertificate(environment: AfipEnvironment): Promise<GenerateCertificateResponseDto> {
        this.logger.log(`Generando certificado para entorno: ${environment}`);

        // Obtener configuración fiscal
        const config = await this.fiscalConfigService.getConfiguration();

        if (!config.businessName || !config.cuit) {
            throw new BadRequestException(
                'Debe configurar la Razón Social y CUIT antes de generar certificados'
            );
        }

        // Verificar que OpenSSL esté disponible
        try {
            execSync('openssl version', { stdio: 'pipe' });
        } catch (error) {
            throw new BadRequestException(
                'OpenSSL no está instalado o no está en el PATH del sistema. ' +
                'Por favor instale OpenSSL para generar certificados.'
            );
        }

        const timestamp = Date.now();
        const keyPath = path.join(this.tempDir, `afip_${environment}_${timestamp}.key`);
        const csrPath = path.join(this.tempDir, `afip_${environment}_${timestamp}.csr`);

        try {
            // 1. Generar clave privada RSA 2048 bits
            this.logger.log('Generando clave privada RSA...');
            execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'pipe' });

            // 2. Generar CSR con el formato requerido por AFIP
            // Subject debe incluir: C=AR, O=Razón Social, CN=Nombre, serialNumber=CUIT XXXXXXXXXXX
            const subject = `/C=AR/O=${this.escapeSubject(config.businessName)}/CN=${this.escapeSubject(config.businessName)}/serialNumber=CUIT ${config.cuit}`;

            this.logger.log('Generando CSR...');
            execSync(
                `openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "${subject}"`,
                { stdio: 'pipe' }
            );

            // 3. Leer archivos generados
            const privateKeyContent = fs.readFileSync(keyPath, 'utf-8');
            const csrContent = fs.readFileSync(csrPath, 'utf-8');

            // 4. Convertir a Base64
            const privateKeyBase64 = Buffer.from(privateKeyContent).toString('base64');
            const csrBase64 = Buffer.from(csrContent).toString('base64');

            // 5. Generar fingerprint del CSR
            const fingerprint = crypto
                .createHash('sha256')
                .update(csrContent)
                .digest('hex')
                .toUpperCase()
                .match(/.{2}/g)
                ?.join(':') || '';

            // 6. Limpiar archivos temporales
            this.cleanup(keyPath, csrPath);

            const instructions = this.getInstructions(environment);

            this.logger.log('Certificados generados exitosamente');

            return {
                csr: csrBase64,
                privateKey: privateKeyBase64,
                fingerprint,
                generatedAt: new Date(),
                environment,
                instructions,
            };
        } catch (error) {
            // Limpiar en caso de error
            this.cleanup(keyPath, csrPath);

            this.logger.error('Error al generar certificados:', error);
            throw new BadRequestException(
                `Error al generar certificados: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
        }
    }

    /**
     * Escapa caracteres especiales en el subject del certificado
     */
    private escapeSubject(text: string): string {
        return text.replace(/[/"\\]/g, '');
    }

    /**
     * Limpia archivos temporales
     */
    private cleanup(...files: string[]) {
        for (const file of files) {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    this.logger.log(`Archivo temporal eliminado: ${file}`);
                }
            } catch (error) {
                this.logger.warn(`No se pudo eliminar archivo temporal: ${file}`);
            }
        }
    }

    /**
     * Obtiene instrucciones según el entorno
     */
    private getInstructions(environment: AfipEnvironment): string {
        if (environment === AfipEnvironment.HOMOLOGACION) {
            return `
Certificado de HOMOLOGACIÓN generado exitosamente.

PASOS A SEGUIR:
1. Descargue el archivo CSR (.csr) que se generó
2. Envíe el CSR por email a: webservices@afip.gov.ar
3. En el asunto indique: "Solicitud certificado Homologación - CUIT [su CUIT]"
4. En el cuerpo del email, mencione el/los Web Service/s que desea usar (ej: wsfe, wsfex)
5. AFIP le responderá con el certificado (.crt) firmado en 1-2 días hábiles
6. Una vez reciba el .crt, súbalo junto con la clave privada (.key) en esta misma pantalla

IMPORTANTE: Guarde la clave privada (.key) en un lugar seguro. La necesitará cuando AFIP le envíe el certificado.
            `.trim();
        } else {
            return `
Certificado de PRODUCCIÓN generado exitosamente.

PASOS A SEGUIR:
1. Descargue el archivo CSR (.csr) que se generó
2. Ingrese a AFIP con Clave Fiscal
3. Vaya a: Administrador de Relaciones de Clave Fiscal > Administración de Certificados Digitales
4. Seleccione "Generar nuevo certificado"
5. Suba el archivo CSR
6. Asocie el certificado al Web Service correspondiente (ej: wsfe)
7. Descargue el certificado (.crt) firmado
8. Suba el certificado junto con la clave privada (.key) en esta misma pantalla

IMPORTANTE: Guarde la clave privada (.key) en un lugar seguro. La necesitará para operar con AFIP.
            `.trim();
        }
    }
}
