import { IsNumber, IsOptional, IsString, MaxLength, Min, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ActualAmountsDto {
    @ApiPropertyOptional({ description: 'Monto real contado en débito', example: 5000 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    debit_card?: number;

    @ApiPropertyOptional({ description: 'Monto real contado en crédito', example: 3000 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    credit_card?: number;

    @ApiPropertyOptional({ description: 'Monto real en transferencias', example: 2000 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    transfer?: number;

    @ApiPropertyOptional({ description: 'Monto real en QR', example: 1000 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    qr?: number;

    @ApiPropertyOptional({ description: 'Monto real en cheques', example: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    check?: number;

    @ApiPropertyOptional({ description: 'Monto real en otros métodos', example: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    other?: number;
}

export class CloseCashRegisterDto {
    @ApiProperty({
        description: 'Monto real de efectivo contado al cerrar la caja',
        example: 25000,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    actualCashAmount!: number;

    @ApiPropertyOptional({
        description: 'Montos reales por otros métodos de pago (opcional)',
        type: ActualAmountsDto,
    })
    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => ActualAmountsDto)
    actualAmounts?: ActualAmountsDto;

    @ApiPropertyOptional({
        description: 'Notas u observaciones al cerrar la caja',
        example: 'Cierre normal, sin novedades',
        maxLength: 1000,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    closingNotes?: string;
}
