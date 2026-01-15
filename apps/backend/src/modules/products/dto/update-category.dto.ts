import { z } from 'zod';
import { CreateCategorySchema } from './create-category.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Length, Matches, IsNumber, Min, Max } from 'class-validator';

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;

export class UpdateCategoryDto implements Partial<UpdateCategoryDTO> {
    @ApiPropertyOptional({ example: 'Bebidas' })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    name?: string;

    @ApiPropertyOptional({ example: 'Bebidas gaseosas y jugos' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @ApiPropertyOptional({ example: '#FF5733' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color inválido (formato: #RRGGBB)' })
    color?: string;

    @ApiPropertyOptional({ example: 25, description: 'Porcentaje de ganancia para productos de esta categoría' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1000000)
    profitMargin?: number | null;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
