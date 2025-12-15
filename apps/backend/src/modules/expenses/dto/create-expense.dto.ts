/**
 * DTO para crear un gasto
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsDateString,
    IsOptional,
    IsBoolean,
    IsUUID,
    Min,
    MaxLength
} from 'class-validator';

export class CreateExpenseDto {
    @ApiProperty({
        description: 'Descripción del gasto',
        example: 'Pago de alquiler mes de noviembre',
        maxLength: 200
})
    @IsString()
    @IsNotEmpty({ message: 'La descripción es requerida' })
    @MaxLength(200)
    description!: string;

    @ApiProperty({
        description: 'Monto del gasto',
        example: 50000,
        minimum: 0.01
})
    @IsNumber({}, { message: 'El monto debe ser un número' })
    @Min(0.01, { message: 'El monto debe ser mayor a 0' })
    amount!: number;

    @ApiProperty({
        description: 'Fecha del gasto',
        example: '2024-11-28'
})
    @IsDateString({}, { message: 'La fecha debe tener formato válido' })
    expenseDate!: string;

    @ApiPropertyOptional({
        description: 'ID de la categoría (opcional)',
        example: 'uuid-de-categoria'
})
    @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'ID del método de pago',
        example: 'uuid-del-metodo'
})
    @IsUUID('4', { message: 'El ID del método de pago debe ser un UUID válido' })
    @IsOptional()
    paymentMethodId?: string;

    @ApiPropertyOptional({
        description: 'Número de comprobante o factura',
        example: 'FAC-001234',
        maxLength: 100
})
    @IsString()
    @IsOptional()
    @MaxLength(100)
    receiptNumber?: string;

    @ApiPropertyOptional({
        description: 'Indica si el gasto está pagado',
        example: true,
        default: true
})
    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @ApiPropertyOptional({
        description: 'Fecha de pago',
        example: '2024-11-28T10:00:00Z'
})
    @IsDateString()
    @IsOptional()
    paidAt?: string;

    @ApiPropertyOptional({
        description: 'Notas adicionales',
        example: 'Pago realizado por transferencia bancaria',
        maxLength: 1000
})
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    notes?: string;
}

