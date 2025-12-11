/**
 * DTO para filtrar gastos
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsDateString,
    IsBoolean,
    IsUUID,
    IsNumber,
    IsEnum,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ExpenseFiltersDto {
    @ApiPropertyOptional({
        description: 'ID de la categoría para filtrar',
    })
    @IsOptional()
    @IsUUID('4')
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'Buscar en descripción',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Fecha de inicio del rango',
        example: '2024-11-01',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Fecha de fin del rango',
        example: '2024-11-30',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por estado de pago',
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isPaid?: boolean;

    @ApiPropertyOptional({
        description: 'Número de página',
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Cantidad de elementos por página',
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Campo por el cual ordenar',
        enum: ['expenseDate', 'amount', 'createdAt'],
        default: 'expenseDate',
    })
    @IsOptional()
    @IsString()
    sortBy?: 'expenseDate' | 'amount' | 'createdAt' = 'expenseDate';

    @ApiPropertyOptional({
        description: 'Orden de clasificación',
        enum: ['ASC', 'DESC'],
        default: 'DESC',
    })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    order?: 'ASC' | 'DESC' = 'DESC';
}

