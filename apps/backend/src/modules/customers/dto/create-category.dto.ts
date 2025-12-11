/**
 * DTO para crear una categoría de clientes
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, Matches } from 'class-validator';
import { z } from 'zod';

export const CreateCustomerCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)').optional(),
    isActive: z.boolean().default(true),
});

export type CreateCustomerCategoryDTO = z.infer<typeof CreateCustomerCategorySchema>;

export class CreateCustomerCategoryDto {
    @ApiProperty({ example: 'VIP', description: 'Nombre de la categoría' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @ApiPropertyOptional({ example: 'Clientes VIP con descuentos especiales', description: 'Descripción' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({ example: '#FF5733', description: 'Color en formato HEX' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color inválido (formato: #RRGGBB)' })
    color?: string;

    @ApiPropertyOptional({ example: true, default: true, description: 'Estado activo' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
