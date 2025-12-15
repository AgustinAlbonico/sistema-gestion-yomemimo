/**
 * DTO para crear un ingreso
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
    MaxLength,
} from 'class-validator';

export class CreateIncomeDto {
    @ApiProperty({
        description: 'Descripción del servicio o ingreso',
        example: 'Servicio de consultoría - Mes de Diciembre',
        maxLength: 200,
    })
    @IsString()
    @IsNotEmpty({ message: 'La descripción es requerida' })
    @MaxLength(200)
    description!: string;

    @ApiProperty({
        description: 'Monto del ingreso',
        example: 50000,
        minimum: 0.01,
    })
    @IsNumber({}, { message: 'El monto debe ser un número' })
    @Min(0.01, { message: 'El monto debe ser mayor a 0' })
    amount!: number;

    @ApiProperty({
        description: 'Fecha del ingreso',
        example: '2024-12-11',
    })
    @IsDateString({}, { message: 'La fecha debe tener formato válido' })
    incomeDate!: string;

    @ApiPropertyOptional({
        description: 'ID de la categoría (opcional)',
        example: 'uuid-de-categoria',
    })
    @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'ID del cliente (opcional - si no se especifica es Consumidor Final)',
        example: 'uuid-del-cliente',
    })
    @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({
        description: 'Nombre del cliente si no hay cliente registrado',
        example: 'Juan Pérez',
        maxLength: 200,
    })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    customerName?: string;

    @ApiPropertyOptional({
        description: 'Indica si es a cuenta corriente',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    isOnAccount?: boolean;

    @ApiPropertyOptional({
        description: 'ID del método de pago (requerido si no es a cuenta corriente)',
        example: 'uuid-del-metodo',
    })
    @IsUUID('4', { message: 'El ID del método de pago debe ser un UUID válido' })
    @IsOptional()
    paymentMethodId?: string;

    @ApiPropertyOptional({
        description: 'Número de comprobante o factura',
        example: 'FAC-001234',
        maxLength: 100,
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    receiptNumber?: string;

    @ApiPropertyOptional({
        description: 'Indica si el ingreso está cobrado',
        example: true,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @ApiPropertyOptional({
        description: 'Notas adicionales',
        example: 'Pago recibido por transferencia bancaria',
        maxLength: 1000,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    notes?: string;
}
