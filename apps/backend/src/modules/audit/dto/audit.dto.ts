/**
 * DTOs para el módulo de auditoría
 */
import { IsEnum, IsOptional, IsString, IsInt, Min, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEntityType, AuditAction } from '../enums';

/**
 * DTO para filtrar logs de auditoría
 */
export class AuditFiltersDto {
    @ApiPropertyOptional({ description: 'Tipo de entidad', enum: AuditEntityType })
    @IsOptional()
    @IsEnum(AuditEntityType)
    entityType?: AuditEntityType;

    @ApiPropertyOptional({ description: 'ID de la entidad' })
    @IsOptional()
    @IsUUID()
    entityId?: string;

    @ApiPropertyOptional({ description: 'Acción realizada', enum: AuditAction })
    @IsOptional()
    @IsEnum(AuditAction)
    action?: AuditAction;

    @ApiPropertyOptional({ description: 'ID del usuario' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ description: 'Fecha inicio (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha fin (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Búsqueda por descripción' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ default: 1, description: 'Página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 20, description: 'Registros por página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}

/**
 * DTO para crear un log de auditoría
 */
export class CreateAuditLogDto {
    @ApiProperty({ description: 'Tipo de entidad', enum: AuditEntityType })
    @IsEnum(AuditEntityType)
    entityType!: AuditEntityType;

    @ApiProperty({ description: 'ID de la entidad' })
    @IsUUID()
    entityId!: string;

    @ApiProperty({ description: 'Acción realizada', enum: AuditAction })
    @IsEnum(AuditAction)
    action!: AuditAction;

    @ApiPropertyOptional({ description: 'Valores anteriores' })
    @IsOptional()
    previousValues?: Record<string, unknown> | null;

    @ApiPropertyOptional({ description: 'Valores nuevos' })
    @IsOptional()
    newValues?: Record<string, unknown> | null;

    @ApiPropertyOptional({ description: 'Metadatos adicionales' })
    @IsOptional()
    metadata?: Record<string, unknown> | null;

    @ApiPropertyOptional({ description: 'Descripción de la acción' })
    @IsOptional()
    @IsString()
    description?: string | null;
}
