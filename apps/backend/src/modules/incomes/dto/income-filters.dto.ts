/**
 * DTO para filtrar ingresos
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsDateString,
    IsBoolean,
    IsUUID,
    IsInt,
    Min,
    IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class IncomeFiltersDto {
    @ApiPropertyOptional({ description: 'ID de categoría' })
    @IsUUID('4')
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'ID del cliente' })
    @IsUUID('4')
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Buscar por descripción' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Fecha desde (YYYY-MM-DD)' })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha hasta (YYYY-MM-DD)' })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Filtrar por estado de pago' })
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @ApiPropertyOptional({ description: 'Filtrar por cuenta corriente' })
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    @IsOptional()
    isOnAccount?: boolean;

    @ApiPropertyOptional({ description: 'Página', default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Límite por página', default: 20 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Campo para ordenar',
        enum: ['incomeDate', 'amount', 'createdAt'],
    })
    @IsEnum(['incomeDate', 'amount', 'createdAt'])
    @IsOptional()
    sortBy?: 'incomeDate' | 'amount' | 'createdAt' = 'incomeDate';

    @ApiPropertyOptional({
        description: 'Orden',
        enum: ['ASC', 'DESC'],
    })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    order?: 'ASC' | 'DESC' = 'DESC';
}
