import {
    IsEnum,
    IsNumber,
    IsString,
    IsNotEmpty,
    MaxLength,
    IsOptional,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType, PaymentMethod } from '../entities/cash-movement.entity';

export class CreateCashMovementDto {
    @ApiProperty({
        description: 'Tipo de movimiento',
        enum: MovementType,
        example: MovementType.EXPENSE,
    })
    @IsEnum(MovementType)
    movementType!: MovementType;

    @ApiProperty({
        description: 'ID del método de pago',
        example: 'uuid-del-metodo',
    })
    @IsUUID('4')
    paymentMethodId!: string;

    @ApiProperty({
        description: 'Monto del movimiento',
        example: 5000,
    })
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'Descripción del movimiento',
        example: 'Retiro para cambio',
        maxLength: 200,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    description!: string;

    @ApiPropertyOptional({
        description: 'Notas adicionales',
        example: 'Autorizado por gerencia',
        maxLength: 1000,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    notes?: string;
}
