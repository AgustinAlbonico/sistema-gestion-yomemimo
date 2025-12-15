/**
 * Controller de Compras
 * Expone endpoints REST para gestión de compras
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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
    constructor(private readonly purchasesService: PurchasesService) { }

    /**
     * Crea una nueva compra
     */
    @Post()
    create(@Body() dto: CreatePurchaseDto, @Request() req: any) {
        return this.purchasesService.create(dto, req.user?.userId);
    }

    /**
     * Obtiene compras con filtros y paginación
     */
    @Get()
    findAll(@Query() filters: PurchaseFiltersDto) {
        return this.purchasesService.findAll(filters);
    }

    /**
     * Obtiene estadísticas de compras
     */
    @Get('stats')
    getStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.purchasesService.getStats(startDate, endDate);
    }

    /**
     * Obtiene lista de proveedores para autocompletado
     */
    @Get('providers')
    getProviders() {
        return this.purchasesService.getProviders();
    }

    /**
     * Obtiene una compra por ID
     */
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.purchasesService.findOne(id);
    }

    /**
     * Actualiza una compra
     */
    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePurchaseDto
    ) {
        return this.purchasesService.update(id, dto);
    }

    /**
     * Marca una compra como pagada
     */
    @Patch(':id/mark-paid')
    markAsPaid(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('paymentMethodId', ParseUUIDPipe) paymentMethodId: string,
        @Request() req: any,
    ) {
        return this.purchasesService.markAsPaid(id, paymentMethodId, req.user?.userId);
    }

    /**
     * Elimina una compra (soft delete)
     */
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
        return this.purchasesService.remove(id, req.user?.userId);
    }
}

