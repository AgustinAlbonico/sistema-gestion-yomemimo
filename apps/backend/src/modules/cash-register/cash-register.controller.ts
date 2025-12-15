import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

import { CashFlowReportFiltersDto } from './dto/cash-flow-report-filters.dto';
import { CashHistoryFiltersDto } from './dto/cash-history-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
    user: { userId: string };
}

@ApiTags('cash-register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
    constructor(private readonly cashRegisterService: CashRegisterService) { }

    // ===== SPRINT 1: Saldo Sugerido =====

    @Get('suggested-initial')
    @ApiOperation({ summary: 'Obtener saldo inicial sugerido (del día anterior)' })
    @ApiResponse({ status: 200, description: 'Saldo sugerido obtenido exitosamente' })
    async getSuggestedInitial() {
        return this.cashRegisterService.getSuggestedInitialAmount();
    }

    @Post('open')
    @ApiOperation({ summary: 'Abrir una nueva caja' })
    @ApiResponse({ status: 201, description: 'Caja abierta exitosamente' })
    @ApiResponse({ status: 400, description: 'Ya existe una caja abierta' })
    async open(@Body() dto: OpenCashRegisterDto, @Request() req: RequestWithUser) {
        return this.cashRegisterService.open(dto, req.user.userId);
    }

    @Post('close')
    @ApiOperation({ summary: 'Cerrar la caja abierta con arqueo detallado' })
    @ApiResponse({ status: 200, description: 'Caja cerrada exitosamente' })
    @ApiResponse({ status: 404, description: 'No hay caja abierta' })
    async close(@Body() dto: CloseCashRegisterDto, @Request() req: RequestWithUser) {
        return this.cashRegisterService.close(dto, req.user.userId);
    }

    @Post(':id/reopen')
    @ApiOperation({ summary: 'Reabrir una caja cerrada del día actual' })
    @ApiResponse({ status: 200, description: 'Caja reabierta exitosamente' })
    @ApiResponse({ status: 400, description: 'La caja no puede ser reabierta' })
    @ApiResponse({ status: 404, description: 'Caja no encontrada' })
    async reopen(@Param('id') id: string, @Request() req: RequestWithUser) {
        return this.cashRegisterService.reopen(id, req.user.userId);
    }

    @Get('current')
    @ApiOperation({ summary: 'Obtener la caja abierta actual' })
    @ApiResponse({ status: 200, description: 'Caja abierta encontrada' })
    @ApiResponse({ status: 404, description: 'No hay caja abierta' })
    async getCurrent() {
        const openRegister = await this.cashRegisterService.getOpenRegister();
        if (!openRegister) {
            return null;
        }
        return openRegister;
    }

    @Get('status')
    @ApiOperation({ summary: 'Obtener estado de la caja (si está abierta y si es del día anterior)' })
    @ApiResponse({ status: 200, description: 'Estado de la caja obtenido exitosamente' })
    async getStatus() {
        return this.cashRegisterService.getCashStatus();
    }

    @Post('movements')
    @ApiOperation({ summary: 'Crear movimiento manual de caja (retiro/ingreso)' })
    @ApiResponse({ status: 201, description: 'Movimiento creado exitosamente' })
    @ApiResponse({ status: 400, description: 'No hay caja abierta' })
    async createMovement(@Body() dto: CreateCashMovementDto, @Request() req: RequestWithUser) {
        return this.cashRegisterService.createManualMovement(dto, req.user.userId);
    }

    // ===== SPRINT 1: Reportes por Rango =====

    @Get('reports/cash-flow')
    @ApiOperation({ summary: 'Reporte de flujo de caja por rango de fechas' })
    @ApiResponse({ status: 200, description: 'Reporte generado exitosamente' })
    async getCashFlowReport(@Query() filters: CashFlowReportFiltersDto) {
        return this.cashRegisterService.getCashFlowReport(filters);
    }

    @Get('history')
    @ApiOperation({ summary: 'Obtener historial de cajas con paginación' })
    @ApiResponse({ status: 200, description: 'Historial obtenido exitosamente' })
    async getHistory(@Query() filters: CashHistoryFiltersDto) {
        const { data, total } = await this.cashRegisterService.findAll(filters);

        return {
            data,
            meta: {
                total,
                page: filters.page || 1,
                limit: filters.limit || 10,
                totalPages: Math.ceil(total / (filters.limit || 10)),
            },
        };
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de cajas' })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
    async getStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.cashRegisterService.getStats(startDate, endDate);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una caja por ID' })
    @ApiResponse({ status: 200, description: 'Caja encontrada' })
    @ApiResponse({ status: 404, description: 'Caja no encontrada' })
    async findOne(@Param('id') id: string) {
        return this.cashRegisterService.findOne(id);
    }
}
