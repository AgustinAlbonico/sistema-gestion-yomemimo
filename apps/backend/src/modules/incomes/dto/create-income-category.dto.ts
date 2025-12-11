/**
 * DTO para crear una categoría de ingreso
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateIncomeCategoryDto {
    @ApiProperty({
        description: 'Nombre de la categoría',
        example: 'Servicios de Consultoría',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(100)
    name!: string;

    @ApiPropertyOptional({
        description: 'Descripción de la categoría',
        example: 'Ingresos por servicios de consultoría y asesoramiento',
    })
    @IsString()
    @IsOptional()
    description?: string;
}
