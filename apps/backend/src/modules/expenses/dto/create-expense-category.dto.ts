/**
 * DTO para crear una categoría de gasto
 */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    MaxLength,
    IsOptional,
    IsBoolean,
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

    @ApiProperty({
        description: 'Descripción de la categoría',
        example: 'Gastos de alquiler mensual',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Si es un gasto recurrente',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;
}

