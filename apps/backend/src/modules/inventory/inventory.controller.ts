import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controlador de inventario - Gestiona stock y movimientos
 */
@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas generales de inventario' })
    @ApiResponse({ status: 200, description: 'Estadísticas del inventario' })
    getStats() {
        return this.inventoryService.getInventoryStats();
    }

    @Get('products')
    @ApiOperation({ summary: 'Obtener todos los productos con su stock' })
    @ApiResponse({ status: 200, description: 'Lista de productos con stock' })
    getAllProductsStock() {
        return this.inventoryService.getAllProductsStock();
    }

    @Get('low-stock')
    @ApiOperation({ summary: 'Obtener productos con stock bajo' })
    @ApiResponse({ status: 200, description: 'Lista de productos con stock bajo' })
    getLowStock() {
        return this.inventoryService.getLowStockProducts();
    }

    @Get('out-of-stock')
    @ApiOperation({ summary: 'Obtener productos sin stock' })
    @ApiResponse({ status: 200, description: 'Lista de productos sin stock' })
    getOutOfStock() {
        return this.inventoryService.getOutOfStockProducts();
    }

    @Post('movement')
    @ApiOperation({ summary: 'Registrar movimiento de stock (entrada o salida)' })
    @ApiResponse({ status: 201, description: 'Movimiento registrado exitosamente' })
    @ApiResponse({ status: 400, description: 'Stock insuficiente o datos inválidos' })
    createMovement(@Body() createStockMovementDto: CreateStockMovementDto) {
        return this.inventoryService.createMovement(createStockMovementDto);
    }

    @Get('product/:id/history')
    @ApiOperation({ summary: 'Obtener historial de movimientos de un producto' })
    @ApiResponse({ status: 200, description: 'Historial de movimientos' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    getProductHistory(@Param('id') id: string) {
        return this.inventoryService.getProductHistory(id);
    }

    @Post('validate-stock')
    @ApiOperation({ summary: 'Validar disponibilidad de stock para múltiples productos' })
    @ApiResponse({ status: 200, description: 'Resultado de validación' })
    validateStock(@Body() items: { productId: string; quantity: number }[]) {
        return this.inventoryService.validateStockAvailability(items);
    }
}
