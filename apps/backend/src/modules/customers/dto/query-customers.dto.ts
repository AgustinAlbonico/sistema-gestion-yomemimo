/**
 * DTO para filtrar y paginar la lista de clientes
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { z } from 'zod';

export const QueryCustomersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    isActive: z.preprocess(
        (val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return val;
        },
        z.boolean().optional()
    ),
    city: z.string().optional(),
    state: z.string().optional(),
    sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt']).default('lastName'),
    order: z.enum(['ASC', 'DESC']).default('ASC'),
});

export type QueryCustomersDTO = z.infer<typeof QueryCustomersSchema>;

export class QueryCustomersDto implements QueryCustomersDTO {
    @ApiPropertyOptional({ example: 1, description: 'Número de página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Registros por página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @ApiPropertyOptional({ example: 'juan', description: 'Buscar por nombre, apellido, email o documento' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por categoría' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ example: true, description: 'Filtrar por estado' })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ example: 'Rosario', description: 'Filtrar por ciudad' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'Santa Fe', description: 'Filtrar por provincia' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ 
        enum: ['firstName', 'lastName', 'email', 'createdAt'], 
        description: 'Campo para ordenar' 
    })
    @IsOptional()
    @IsEnum(['firstName', 'lastName', 'email', 'createdAt'])
    sortBy: 'firstName' | 'lastName' | 'email' | 'createdAt' = 'lastName';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Dirección del orden' })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    order: 'ASC' | 'DESC' = 'ASC';
}
