/**
 * DTO para crear una categoría de gasto
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    MaxLength,
} from 'class-validator';

export class CreateExpenseCategoryDto {
    @ApiProperty({
        description: 'Nombre de la categoría',
        example: 'Alquiler',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(100)
    name!: string;

    @ApiPropertyOptional({
        description: 'Descripción de la categoría',
        example: 'Gastos de alquiler del local',
    })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        description: 'Indica si es una categoría de gastos recurrentes',
        example: true,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;
}

