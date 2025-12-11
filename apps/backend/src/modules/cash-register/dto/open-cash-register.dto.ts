import { IsNumber, IsOptional, IsString, MaxLength, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashRegisterDto {
    @ApiProperty({
        description: 'Monto inicial en efectivo al abrir la caja',
        example: 10000,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    initialAmount!: number;

    @ApiPropertyOptional({
        description: 'Indica si el monto inicial fue ajustado manualmente respecto al saldo del día anterior',
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    manuallyAdjusted?: boolean;

    @ApiPropertyOptional({
        description: 'Razón del ajuste si el monto difiere del día anterior (ej: depósito bancario)',
        example: 'Depósito bancario de $5000',
        maxLength: 500,
    })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    adjustmentReason?: string;

    @ApiPropertyOptional({
        description: 'Notas u observaciones al abrir la caja',
        example: 'Apertura de caja del día',
        maxLength: 1000,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    openingNotes?: string;
}
