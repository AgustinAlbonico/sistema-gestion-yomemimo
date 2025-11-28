import { z } from 'zod';
import { BaseProductSchema } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsInt, Min, Length } from 'class-validator';

export const UpdateProductSchema = BaseProductSchema.partial();

export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;

/**
 * DTO para actualizar producto - Simplificado
 */
export class UpdateProductDto {
    @ApiPropertyOptional({ example: 'Coca Cola 500ml' })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    name?: string;

    @ApiPropertyOptional({ example: 100.00 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    cost?: number;

    @ApiPropertyOptional({ example: 10, description: 'Stock actual' })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
