import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Length, Matches, IsNumber, Min, Max } from 'class-validator';

export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)').optional(),
    profitMargin: z.number().min(0).max(1000).optional().nullable(),
    isActive: z.boolean().default(true),
});

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;

export class CreateCategoryDto implements CreateCategoryDTO {
    @ApiProperty({ example: 'Bebidas' })
    @IsString()
    @Length(1, 100)
    name!: string;

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

    @ApiPropertyOptional({ example: 25.00, description: 'Porcentaje de ganancia para productos de esta categoría' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1000)
    profitMargin?: number | null;

    @ApiProperty({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive!: boolean;
}

