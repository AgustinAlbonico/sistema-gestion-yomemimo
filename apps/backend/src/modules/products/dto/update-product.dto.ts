import { z } from 'zod';
import { BaseProductSchema } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsInt, Min, Max, Length } from 'class-validator';

export const UpdateProductSchema = BaseProductSchema.partial();

export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;

/**
 * DTO para actualizar producto - Simplificado
 * Categoría opcional (una sola)
 * Opcional: margen de ganancia personalizado
 */
export class UpdateProductDto {
    @ApiPropertyOptional({ example: 'Shampoo Sedal 400ml' })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    name?: string;

    @ApiPropertyOptional({ example: 'Shampoo reparador para cabello dañado', description: 'Descripción del producto' })
    @IsOptional()
    @IsString()
    @Length(0, 1000)
    description?: string | null;

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    cost?: number | null;

    @ApiPropertyOptional({ example: 150, description: 'Precio final (usado cuando useManualPrice = true)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional({ example: 10, description: 'Stock actual' })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({ type: String, description: 'ID de la categoría' })
    @IsOptional()
    @IsUUID('4')
    categoryId?: string | null;

    @ApiPropertyOptional({ example: 'Sedal', description: 'Nombre de la marca' })
    @IsOptional()
    @IsString()
    @Length(0, 100)
    brandName?: string | null;

    @ApiPropertyOptional({ example: '1234567890123', description: 'Código de barras del producto' })
    @IsOptional()
    @IsString()
    @Length(0, 100)
    barcode?: string | null;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ example: false, description: 'Usar margen de ganancia personalizado' })
    @IsOptional()
    @IsBoolean()
    useCustomMargin?: boolean;

    @ApiPropertyOptional({ example: 40, description: 'Margen de ganancia personalizado (%)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1000000)
    customProfitMargin?: number;

    @ApiPropertyOptional({ example: true, description: 'Usar precio fijo cargado manualmente' })
    @IsOptional()
    @IsBoolean()
    useManualPrice?: boolean;
}

