import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, IsDateString, MaxLength } from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

/**
 * DTO para crear un movimiento de stock
 */
export class CreateStockMovementDto {
    @ApiProperty({ format: 'uuid', description: 'ID del producto' })
    @IsUUID()
    productId!: string;

    @ApiProperty({ enum: StockMovementType, description: 'Tipo de movimiento (IN=entrada, OUT=salida)' })
    @IsEnum(StockMovementType)
    type!: StockMovementType;

    @ApiProperty({ example: 10, description: 'Cantidad a mover' })
    @IsInt()
    @Min(1)
    quantity!: number;

    @ApiPropertyOptional({ example: 150.50, description: 'Costo unitario (solo para entradas)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    cost?: number;

    @ApiPropertyOptional({ example: 'Proveedor A', description: 'Nombre del proveedor' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    provider?: string;

    @ApiPropertyOptional({ example: 'Compra de mercadería', description: 'Notas o motivo del movimiento' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @ApiProperty({ example: '2025-11-28T00:00:00Z', description: 'Fecha del movimiento' })
    @IsDateString()
    date!: string;
}
