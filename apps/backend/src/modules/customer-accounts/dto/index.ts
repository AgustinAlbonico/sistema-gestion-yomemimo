/**
 * DTOs para el módulo de cuentas corrientes
 */
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean, Min, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AccountStatus } from '../entities/customer-account.entity';

/**
 * DTO para crear un cargo (venta a cuenta)
 */
export class CreateChargeDto {
    @ApiProperty({ description: 'Monto del cargo', example: 1500.50 })
    @IsNumber()
    @Min(0.01)
    amount!: number;

    @ApiProperty({ description: 'Descripción del cargo', example: 'Venta #0001' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    description!: string;

    @ApiPropertyOptional({ description: 'ID de la venta relacionada' })
    @IsOptional()
    @IsUUID()
    saleId?: string;

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}

/**
 * DTO para registrar un pago
 */
export class CreatePaymentDto {
    @ApiProperty({ description: 'Monto del pago', example: 1000 })
    @IsNumber()
    @Min(0.01)
    amount!: number;

    @ApiProperty({ description: 'ID del método de pago' })
    @IsUUID()
    paymentMethodId!: string;

    @ApiPropertyOptional({ description: 'Descripción del pago' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}

/**
 * DTO para actualizar una cuenta corriente
 */
export class UpdateAccountDto {
    @ApiPropertyOptional({ description: 'Límite de crédito', example: 50000 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    creditLimit?: number;

    @ApiPropertyOptional({ description: 'Estado de la cuenta', enum: AccountStatus })
    @IsOptional()
    @IsEnum(AccountStatus)
    status?: AccountStatus;
}

/**
 * DTO para filtrar cuentas corrientes
 */
export class AccountFiltersDto {
    @ApiPropertyOptional({ description: 'Página', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Límite por página', example: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Estado de la cuenta', enum: AccountStatus })
    @IsOptional()
    @IsEnum(AccountStatus)
    status?: AccountStatus;

    @ApiPropertyOptional({ description: 'Solo cuentas con deuda > 0' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    hasDebt?: boolean;

    @ApiPropertyOptional({ description: 'Solo cuentas con días de mora > 0' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isOverdue?: boolean;

    @ApiPropertyOptional({ description: 'Búsqueda por nombre de cliente' })
    @IsOptional()
    @IsString()
    search?: string;
}
