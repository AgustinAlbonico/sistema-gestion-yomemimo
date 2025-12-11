import { IsDateString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/cash-movement.entity';

export class CashFlowReportFiltersDto {
    @ApiProperty({
        description: 'Fecha de inicio del reporte',
        example: '2024-12-01',
    })
    @IsDateString()
    startDate!: string;

    @ApiProperty({
        description: 'Fecha de fin del reporte',
        example: '2024-12-31',
    })
    @IsDateString()
    endDate!: string;

    @ApiPropertyOptional({
        description: 'Filtrar por método de pago específico',
        enum: PaymentMethod,
    })
    @IsEnum(PaymentMethod)
    @IsOptional()
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({
        description: 'Incluir comparación con el período anterior',
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    includeComparison?: boolean;
}
