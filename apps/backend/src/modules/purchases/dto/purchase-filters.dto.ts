/**
 * DTO para filtros de búsqueda de compras
 */
import {
    IsOptional,
    IsString,
    IsEnum,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PurchaseStatus } from '../entities/purchase.entity';

export class PurchaseFiltersDto {
    @IsOptional()
    @IsString()
    providerName?: string;

    @IsOptional()
    @IsEnum(PurchaseStatus, { message: 'Estado de compra inválido' })
    status?: PurchaseStatus;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsString()
    invoiceNumber?: string;

    @IsOptional()
    @IsString()
    productId?: string; // Filtrar por compras que incluyan este producto

    @IsOptional()
    @IsString()
    search?: string; // Búsqueda general

    @IsOptional()
    @Transform(({ value }) => Number.parseInt(value, 10))
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @Transform(({ value }) => Number.parseInt(value, 10))
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @IsString()
    sortBy?: 'purchaseDate' | 'total' | 'createdAt' | 'purchaseNumber';

    @IsOptional()
    @IsEnum(['ASC', 'DESC'], { message: 'Orden inválido' })
    order?: 'ASC' | 'DESC';
}

