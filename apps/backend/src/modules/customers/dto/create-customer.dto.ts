/**
 * DTO para crear un nuevo cliente
 * Validación con Zod + class-validator + decoradores Swagger
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsEmail, IsEnum, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { z } from 'zod';
import { DocumentType } from '../entities/customer.entity';
import { IvaCondition } from '../../../common/enums/iva-condition.enum';

export const CreateCustomerSchema = z.object({
    firstName: z.string().min(1, 'El nombre es requerido').max(100),
    lastName: z.string().min(1, 'El apellido es requerido').max(100),
    documentType: z.nativeEnum(DocumentType).nullable().optional(),
    ivaCondition: z.nativeEnum(IvaCondition).nullable().optional(),
    documentNumber: z.string().max(50).nullable().optional().or(z.literal('')),
    email: z.string().email('Email inválido').max(255).nullable().optional().or(z.literal('')),
    phone: z.string().max(20).nullable().optional().or(z.literal('')),
    mobile: z.string().max(20).nullable().optional().or(z.literal('')),
    address: z.string().max(255).nullable().optional().or(z.literal('')),
    city: z.string().max(100).nullable().optional().or(z.literal('')),
    state: z.string().max(100).nullable().optional().or(z.literal('')),
    postalCode: z.string().max(20).nullable().optional().or(z.literal('')),
    categoryId: z.string().uuid().nullable().optional().or(z.literal('')),
    notes: z.string().max(5000).nullable().optional().or(z.literal('')),
    isActive: z.boolean().default(true),
});

export type CreateCustomerDTO = z.infer<typeof CreateCustomerSchema>;

export class CreateCustomerDto {
    @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;

    @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;

    @ApiPropertyOptional({
        enum: DocumentType,
        description: 'Tipo de documento'
    })
    @IsOptional()
    @ValidateIf((o) => o.documentType !== null && o.documentType !== undefined)
    @IsEnum(DocumentType)
    documentType?: DocumentType | null;

    @ApiPropertyOptional({
        enum: IvaCondition,
        description: 'Condición frente al IVA'
    })
    @IsOptional()
    @ValidateIf((o) => o.ivaCondition !== null && o.ivaCondition !== undefined)
    @IsEnum(IvaCondition)
    ivaCondition?: IvaCondition | null;

    @ApiPropertyOptional({ example: '12345678', description: 'Número de documento' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    documentNumber?: string;

    @ApiPropertyOptional({ example: 'juan.perez@email.com', description: 'Email' })
    @IsOptional()
    @ValidateIf((o) => o.email && o.email.length > 0)
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({ example: '0341-4567890', description: 'Teléfono fijo' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @ApiPropertyOptional({ example: '341-5123456', description: 'Celular' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    mobile?: string;

    @ApiPropertyOptional({ example: 'Calle Falsa 123', description: 'Dirección' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;

    @ApiPropertyOptional({ example: 'Rosario', description: 'Ciudad' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @ApiPropertyOptional({ example: 'Santa Fe', description: 'Provincia' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @ApiPropertyOptional({ example: '2000', description: 'Código postal' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    postalCode?: string;

    @ApiPropertyOptional({ format: 'uuid', description: 'ID de categoría' })
    @IsOptional()
    @ValidateIf((o) => o.categoryId && o.categoryId.length > 0)
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ example: 'Cliente preferencial', description: 'Notas' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notes?: string;

    @ApiPropertyOptional({ example: true, default: true, description: 'Estado activo' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
