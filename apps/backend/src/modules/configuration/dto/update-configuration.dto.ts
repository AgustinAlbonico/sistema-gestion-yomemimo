import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';

/**
 * DTO para actualizar configuración del sistema
 */
export class UpdateConfigurationDto {
    @ApiPropertyOptional({ example: 30, description: 'Margen de ganancia por defecto (%)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1000000)
    defaultProfitMargin?: number;

    @ApiPropertyOptional({ example: 5, description: 'Stock mínimo para alertas' })
    @IsOptional()
    @IsInt()
    @Min(0)
    minStockAlert?: number;
}
