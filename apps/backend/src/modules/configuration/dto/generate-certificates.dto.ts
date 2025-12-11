/**
 * DTOs para generación de certificados AFIP
 */
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AfipEnvironment } from '../entities/fiscal-configuration.entity';

/**
 * DTO para generar CSR y clave privada
 */
export class GenerateCertificateDto {
    @ApiProperty({ enum: AfipEnvironment, description: 'Entorno para el que se generará el certificado' })
    @IsEnum(AfipEnvironment)
    environment!: AfipEnvironment;
}

/**
 * Respuesta de generación de certificados
 */
export class GenerateCertificateResponseDto {
    @ApiProperty({ description: 'CSR (Certificate Signing Request) en formato Base64' })
    csr!: string;

    @ApiProperty({ description: 'Clave privada en formato Base64' })
    privateKey!: string;

    @ApiProperty({ description: 'Huella digital (fingerprint) del CSR' })
    fingerprint!: string;

    @ApiProperty({ description: 'Fecha de generación' })
    generatedAt!: Date;

    @ApiProperty({ description: 'Entorno para el que se generó' })
    environment!: AfipEnvironment;

    @ApiProperty({ description: 'Instrucciones para el usuario' })
    instructions!: string;
}
