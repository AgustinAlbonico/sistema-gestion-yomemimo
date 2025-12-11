/**
 * DTO para filtrar ventas
 */
import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsBoolean,
    Min,
    IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SaleStatus } from '../entities/sale.entity';

/**
 * Estados de facturación para filtrar
 */
export enum InvoiceFilterStatus {
    FISCAL = 'fiscal',           // Factura fiscal autorizada
    NO_FISCAL = 'no_fiscal',     // Sin factura fiscal
    ERROR = 'error',             // Error al generar factura
    PENDING = 'pending',         // Pendiente de facturación
}

export class SaleFiltersDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(SaleStatus)
    status?: SaleStatus;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;

    @IsOptional()
    @IsUUID()
    productId?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    fiscalPending?: boolean; // Filtrar ventas con factura fiscal pendiente (deprecated, usar invoiceStatus)

    @IsOptional()
    @IsEnum(InvoiceFilterStatus)
    invoiceStatus?: InvoiceFilterStatus; // Filtrar por estado de facturación

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    order?: 'ASC' | 'DESC';
}

