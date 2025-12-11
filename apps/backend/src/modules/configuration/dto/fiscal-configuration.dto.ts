/**
 * DTOs para configuración fiscal AFIP
 */
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, Length, Matches, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AfipEnvironment } from '../entities/fiscal-configuration.entity';
import { IvaCondition } from '../../../common/enums/iva-condition.enum';

/**
 * DTO para actualizar datos del emisor
 */
export class UpdateEmitterDataDto {
    @ApiPropertyOptional({ description: 'Razón social del negocio' })
    @IsOptional()
    @IsString()
    @Length(2, 200)
    businessName?: string;

    @ApiPropertyOptional({ description: 'CUIT del emisor (11 dígitos sin guiones)' })
    @IsOptional()
    @IsString()
    @Length(11, 11)
    @Matches(/^\d{11}$/, { message: 'CUIT debe tener 11 dígitos numéricos' })
    cuit?: string;

    @ApiPropertyOptional({ description: 'Número de Ingresos Brutos' })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    grossIncome?: string;

    @ApiPropertyOptional({ description: 'Fecha de inicio de actividades (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    activityStartDate?: string;

    @ApiPropertyOptional({ description: 'Domicilio comercial' })
    @IsOptional()
    @IsString()
    @Length(5, 300)
    businessAddress?: string;

    @ApiPropertyOptional({ enum: IvaCondition, description: 'Condición frente al IVA' })
    @IsOptional()
    @IsEnum(IvaCondition)
    ivaCondition?: IvaCondition;

    @ApiPropertyOptional({ description: 'Punto de venta AFIP (1-99999)' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(99999)
    pointOfSale?: number;
}

/**
 * DTO para cambiar el entorno activo
 */
export class UpdateAfipEnvironmentDto {
    @ApiProperty({ enum: AfipEnvironment, description: 'Entorno activo de AFIP' })
    @IsEnum(AfipEnvironment)
    environment!: AfipEnvironment;
}

/**
 * DTO para subir certificados
 * Los certificados se envían como Base64
 */
export class UploadCertificatesDto {
    @ApiProperty({ enum: AfipEnvironment, description: 'Entorno para los certificados' })
    @IsEnum(AfipEnvironment)
    environment!: AfipEnvironment;

    @ApiProperty({ description: 'Contenido del certificado (.crt) en Base64' })
    @IsString()
    certificate!: string;

    @ApiProperty({ description: 'Contenido de la clave privada (.key) en Base64' })
    @IsString()
    privateKey!: string;

    @ApiPropertyOptional({ description: 'Fecha de expiración del certificado (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

/**
 * Respuesta de configuración fiscal (sin datos sensibles)
 */
export class FiscalConfigurationResponseDto {
    @ApiProperty()
    id!: string;

    @ApiPropertyOptional()
    businessName?: string | null;

    @ApiPropertyOptional()
    cuit?: string | null;

    @ApiPropertyOptional()
    grossIncome?: string | null;

    @ApiPropertyOptional()
    activityStartDate?: Date | null;

    @ApiPropertyOptional()
    businessAddress?: string | null;

    @ApiProperty({ enum: IvaCondition })
    ivaCondition!: IvaCondition;

    @ApiProperty()
    pointOfSale!: number;

    @ApiProperty({ enum: AfipEnvironment })
    afipEnvironment!: AfipEnvironment;

    @ApiProperty()
    isConfigured!: boolean;

    // Certificados homologación (solo metadatos, sin contenido)
    @ApiProperty()
    homologacionReady!: boolean;

    @ApiPropertyOptional()
    homologacionUploadedAt?: Date | null;

    @ApiPropertyOptional()
    homologacionExpiresAt?: Date | null;

    @ApiPropertyOptional()
    homologacionFingerprint?: string | null;

    // Certificados producción (solo metadatos, sin contenido)
    @ApiProperty()
    produccionReady!: boolean;

    @ApiPropertyOptional()
    produccionUploadedAt?: Date | null;

    @ApiPropertyOptional()
    produccionExpiresAt?: Date | null;

    @ApiPropertyOptional()
    produccionFingerprint?: string | null;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * Estado de conexión con AFIP
 */
export class AfipConnectionStatusDto {
    @ApiProperty({ description: 'Si AFIP está configurado' })
    configured!: boolean;

    @ApiProperty({ enum: AfipEnvironment, description: 'Entorno activo' })
    environment!: AfipEnvironment;

    @ApiProperty({ description: 'Si hay certificados para el entorno activo' })
    certificatesReady!: boolean;

    @ApiProperty({ description: 'Resultado del test de conexión' })
    connection!: {
        success: boolean;
        message: string;
        testedAt: Date;
    };
}

