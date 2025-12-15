import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO para parámetros de paginación
 */
export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Número de página (comienza en 1)',
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Cantidad de elementos por página',
        minimum: 1,
        maximum: 100,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}

/**
 * Metadata de paginación
 */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Respuesta paginada genérica
 */
export class PaginatedResponseDto<T> {
    data: T[];
    meta: PaginationMeta;

    constructor(data: T[], total: number, page: number, limit: number) {
        this.data = data;
        this.meta = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
