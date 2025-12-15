/**
 * DTO para crear una categoría de gasto
 */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
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
}

