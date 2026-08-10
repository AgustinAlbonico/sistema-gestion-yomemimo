// touched
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// touched
import { z } from 'zod';
// touched
import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsInt, Min, Max, Length } from 'class-validator';

/**
 * Schema simplificado para crear producto
 * Solo: nombre, costo, stock, categoría (opcional, una sola)
 * Opcional: margen de ganancia personalizado
 * Opcional: modo precio fijo (price cargado directamente, sin cálculo desde costo)
 */
export const BaseProductSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    description: z.string().max(1000).optional().nullable(),
    cost: z.number().min(0, 'El costo debe ser 0 o mayor').optional().nullable(),
    price: z.number().min(0, 'El precio debe ser 0 o mayor').optional(),
    stock: z.number().int().min(0).optional().default(0),
    categoryId: z.string().uuid().optional().nullable(),
    brandName: z.string().max(100).optional().nullable(),
    barcode: z.string().max(100).optional().nullable(),
    isActive: z.boolean().default(true),
    // Margen de ganancia personalizado (opcional)
    useCustomMargin: z.boolean().optional().default(false),
    customProfitMargin: z.number().min(0).max(1000000).optional(),
    // Modo precio fijo: cuando es true, el price se carga directamente y no se calcula desde costo+margen
    useManualPrice: z.boolean().optional().default(true),
});

export const CreateProductSchema = BaseProductSchema;

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;

/**
 * DTO para crear producto - Simplificado
 * Categoría opcional (una sola)
 * Opcional: margen de ganancia personalizado
 */
export class CreateProductDto {
    @ApiProperty({ example: 'Shampoo Sedal 400ml', description: 'Nombre del producto' })
    @IsString()
    @Length(1, 255)
    name!: string;

    @ApiPropertyOptional({ example: 'Shampoo reparador para cabello dañado', description: 'Descripción del producto' })
    @IsOptional()
    @IsString()
    @Length(0, 1000)
    description?: string | null;

    @ApiProperty({ example: 100, description: 'Costo del producto (opcional si useManualPrice = true)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    cost?: number | null;

    @ApiPropertyOptional({ example: 150, description: 'Precio final del producto (requerido si useManualPrice = true)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional({ example: 10, description: 'Stock inicial' })
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

    @ApiPropertyOptional({ example: true, default: true })
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

    @ApiPropertyOptional({ example: true, default: true, description: 'Usar precio fijo cargado manualmente (sin cálculo desde costo)' })
    @IsOptional()
    @IsBoolean()
    useManualPrice?: boolean;
}

