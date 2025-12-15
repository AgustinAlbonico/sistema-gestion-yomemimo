/**
 * DTO para aplicar recargo/interés a una cuenta corriente
 */
import { IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SurchargeType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
}

export class ApplySurchargeDto {
    @ApiProperty({
        description: 'Tipo de recargo',
        enum: SurchargeType,
        example: SurchargeType.PERCENTAGE,
    })
    @IsEnum(SurchargeType)
    surchargeType!: SurchargeType;

    @ApiProperty({
        description: 'Valor del recargo (porcentaje o monto fijo)',
        example: 3,
        minimum: 0.01,
    })
    @IsNumber()
    @Min(0.01, { message: 'El valor debe ser mayor a 0' })
    value!: number;

    @ApiPropertyOptional({
        description: 'Descripción del recargo',
        example: 'Recargo por mora - Diciembre 2024',
        maxLength: 200,
    })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    description?: string;
}
