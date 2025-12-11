/**
 * DTO para actualización de compras
 * Solo permite modificar ciertos campos después de creada
 */
import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    Min,
    MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types'; // Or @nestjs/swagger
import { CreatePurchaseDto } from './create-purchase.dto';
import { PurchaseStatus } from '../entities/purchase.entity';

/**
 * DTO para actualización de compra
 * No se pueden modificar items después de crear la compra
 */
export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {
    @IsString()
    @IsOptional()
    paymentMethodId?: string;
}
