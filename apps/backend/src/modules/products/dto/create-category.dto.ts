import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Length, Matches } from 'class-validator';

export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)').optional(),
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

    @ApiProperty({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive!: boolean;
}
