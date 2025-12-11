/**
 * DTO para actualizar ventas
 */
import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    Min,
    IsBoolean,
    MaxLength,
    IsUUID,
} from 'class-validator';
import { SaleStatus } from '../entities/sale.entity';

/**
 * DTO para actualizar una venta
 * Solo permite actualizar campos que no afectan el inventario
 */
export class UpdateSaleDto {
    @IsUUID()
    @IsOptional()
    customerId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    customerName?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    discount?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    surcharge?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    tax?: number;

    @IsEnum(SaleStatus)
    @IsOptional()
    status?: SaleStatus;

    @IsBoolean()
    @IsOptional()
    isOnAccount?: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    notes?: string;
}

