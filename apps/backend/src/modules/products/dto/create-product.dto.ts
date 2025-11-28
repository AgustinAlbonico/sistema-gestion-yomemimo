import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsInt, Min, Max, Length } from 'class-validator';

/**
 * Schema simplificado para crear producto
 * Solo: nombre, costo, stock, categoría
 */
export const BaseProductSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    cost: z.number().min(0, 'El costo debe ser 0 o mayor'),
    stock: z.number().int().min(0).optional().default(0),
    categoryId: z.string().uuid().optional(),
    isActive: z.boolean().default(true),
});

export const CreateProductSchema = BaseProductSchema;

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;

/**
 * DTO para crear producto - Simplificado
 */
export class CreateProductDto {
    @ApiProperty({ example: 'Coca Cola 500ml', description: 'Nombre del producto' })
    @IsString()
    @Length(1, 255)
    name!: string;

    @ApiProperty({ example: 100.00, description: 'Costo del producto' })
    @IsNumber()
    @Min(0)
    cost!: number;

    @ApiPropertyOptional({ example: 10, description: 'Stock inicial' })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({ format: 'uuid', description: 'ID de categoría' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
