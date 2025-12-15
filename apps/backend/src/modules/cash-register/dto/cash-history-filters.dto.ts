import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/**
 * DTO para filtros de historial de cajas
 */
export class CashHistoryFiltersDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Fecha específica para buscar (YYYY-MM-DD). Mutuamente excluyente con startDate/endDate',
        example: '2025-12-13',
    })
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional({
        description: 'Fecha de inicio del rango (YYYY-MM-DD). Requiere endDate',
        example: '2025-12-01',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Fecha de fin del rango (YYYY-MM-DD). Requiere startDate',
        example: '2025-12-31',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
