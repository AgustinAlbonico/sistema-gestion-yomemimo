/**
 * Controlador de Ventas
 * Endpoints para gestionar ventas
 */
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { SalesService, PaginatedSales, SaleStats } from './sales.service';
import {
    CreateSaleDto,
    UpdateSaleDto,
    SaleFiltersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Sale } from './entities/sale.entity';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
    constructor(private readonly salesService: SalesService) {}

    /**
     * Crea una nueva venta
     */
    @Post()
    create(@Body() dto: CreateSaleDto, @Request() req: any) {
        return this.salesService.create(dto, req.user?.id);
    }

    /**
     * Obtiene ventas con filtros y paginación
     */
    @Get()
    findAll(@Query() filters: SaleFiltersDto): Promise<PaginatedSales> {
        return this.salesService.findAll(filters);
    }

    /**
     * Obtiene estadísticas de ventas
     */
    @Get('stats')
    getStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ): Promise<SaleStats> {
        return this.salesService.getStats(startDate, endDate);
    }

    /**
     * Obtiene ventas del día actual
     */
    @Get('today')
    getTodaySales() {
        return this.salesService.getTodaySales();
    }

    /**
     * Obtiene una venta por ID
     */
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.salesService.findOne(id);
    }

    /**
     * Actualiza una venta
     */
    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSaleDto
    ) {
        return this.salesService.update(id, dto);
    }

    /**
     * Cancela una venta
     */
    @Patch(':id/cancel')
    cancel(@Param('id', ParseUUIDPipe) id: string) {
        return this.salesService.cancel(id);
    }

    /**
     * Marca una venta pendiente como pagada
     */
    @Patch(':id/pay')
    markAsPaid(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { payments: any[] }
    ) {
        return this.salesService.markAsPaid(id, body.payments || []);
    }

    /**
     * Elimina una venta (soft delete)
     */
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.salesService.remove(id);
    }
}

