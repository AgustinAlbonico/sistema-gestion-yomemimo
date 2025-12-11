/**
 * Controlador de ingresos
 * Endpoints REST para gestión de ingresos
 */
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, UpdateIncomeDto, IncomeFiltersDto } from './dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
    user?: { userId: string };
}

@ApiTags('Incomes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
    constructor(private readonly incomesService: IncomesService) { }

    @Post()
    @ApiOperation({ summary: 'Crear ingreso' })
    create(@Body() dto: CreateIncomeDto, @Req() req: RequestWithUser) {
        const userId = req.user?.userId;
        return this.incomesService.create(dto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Listar ingresos con filtros' })
    findAll(@Query() filters: IncomeFiltersDto) {
        return this.incomesService.findAll(filters);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de ingresos' })
    getStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.incomesService.getStats(startDate, endDate);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener ingreso por ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.incomesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar ingreso' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateIncomeDto,
    ) {
        return this.incomesService.update(id, dto);
    }

    @Patch(':id/mark-paid')
    @ApiOperation({ summary: 'Marcar ingreso como cobrado' })
    markAsPaid(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('paymentMethodId', ParseUUIDPipe) paymentMethodId: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user?.userId || '';
        return this.incomesService.markAsPaid(id, userId, paymentMethodId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar ingreso' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.incomesService.remove(id);
    }
}
