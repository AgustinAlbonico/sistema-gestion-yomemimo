/**
 * Controlador de Cuentas Corrientes
 * Expone endpoints REST para gestión de cuentas corrientes
 */
import {
    Controller,
    Get,
    Post,
    Patch,
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
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerAccountsService } from './customer-accounts.service';
import { CreateChargeDto, CreatePaymentDto, UpdateAccountDto, AccountFiltersDto } from './dto';

@ApiTags('customer-accounts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('customer-accounts')
export class CustomerAccountsController {
    constructor(
        private readonly accountsService: CustomerAccountsService,
    ) { }

    /**
     * Lista todas las cuentas corrientes con filtros
     */
    @Get()
    @ApiOperation({ summary: 'Listar cuentas corrientes' })
    @ApiResponse({ status: 200, description: 'Lista de cuentas corrientes' })
    async findAll(@Query() filters: AccountFiltersDto) {
        return this.accountsService.findAll(filters);
    }

    /**
     * Obtiene estadísticas globales
     */
    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de cuentas corrientes' })
    @ApiResponse({ status: 200, description: 'Estadísticas de cuentas' })
    async getStats() {
        return this.accountsService.getStats();
    }

    /**
     * Obtiene lista de deudores
     */
    @Get('debtors')
    @ApiOperation({ summary: 'Listar clientes deudores' })
    @ApiResponse({ status: 200, description: 'Lista de clientes con deuda' })
    async getDebtors() {
        return this.accountsService.getDebtors();
    }

    /**
     * Obtiene alertas de deudores morosos
     */
    @Get('overdue-alerts')
    @ApiOperation({ summary: 'Obtener alertas de deudores morosos' })
    @ApiResponse({ status: 200, description: 'Lista de alertas de morosos' })
    async getOverdueAlerts() {
        return this.accountsService.getOverdueAlerts();
    }

    /**
     * Obtiene el estado de cuenta de un cliente
     */
    @Get(':customerId')
    @ApiOperation({ summary: 'Obtener estado de cuenta de un cliente' })
    @ApiParam({ name: 'customerId', description: 'ID del cliente' })
    @ApiResponse({ status: 200, description: 'Estado de cuenta del cliente' })
    async getAccountStatement(@Param('customerId') customerId: string) {
        return this.accountsService.getAccountStatement(customerId);
    }

    /**
     * Crea un cargo en la cuenta (desde venta)
     */
    @Post(':customerId/charges')
    @ApiOperation({ summary: 'Crear cargo en cuenta corriente' })
    @ApiParam({ name: 'customerId', description: 'ID del cliente' })
    @ApiResponse({ status: 201, description: 'Cargo creado' })
    @ApiResponse({ status: 400, description: 'Error de validación o límite excedido' })
    async createCharge(
        @Param('customerId') customerId: string,
        @Body() dto: CreateChargeDto,
        @Request() req: any,
    ) {
        const userId = req.user?.userId;
        return this.accountsService.createCharge(customerId, dto, userId);
    }

    /**
     * Registra un pago del cliente
     */
    @Post(':customerId/payments')
    @ApiOperation({ summary: 'Registrar pago de cliente' })
    @ApiParam({ name: 'customerId', description: 'ID del cliente' })
    @ApiResponse({ status: 201, description: 'Pago registrado' })
    @ApiResponse({ status: 400, description: 'Error de validación o monto excede deuda' })
    async createPayment(
        @Param('customerId') customerId: string,
        @Body() dto: CreatePaymentDto,
        @Request() req: any,
    ) {
        const userId = req.user?.userId;
        return this.accountsService.createPayment(customerId, dto, userId);
    }

    /**
     * Actualiza una cuenta corriente
     */
    @Patch(':customerId')
    @ApiOperation({ summary: 'Actualizar cuenta corriente' })
    @ApiParam({ name: 'customerId', description: 'ID del cliente' })
    @ApiResponse({ status: 200, description: 'Cuenta actualizada' })
    async updateAccount(
        @Param('customerId') customerId: string,
        @Body() dto: UpdateAccountDto,
    ) {
        return this.accountsService.updateAccount(customerId, dto);
    }

    /**
     * Suspende la cuenta de un cliente
     */
    @Post(':customerId/suspend')
    @ApiOperation({ summary: 'Suspender cuenta de cliente' })
    @ApiParam({ name: 'customerId', description: 'ID del cliente' })
    @ApiResponse({ status: 200, description: 'Cuenta suspendida' })
    async suspendAccount(@Param('customerId') customerId: string) {
        return this.accountsService.suspendAccount(customerId);
    }

    /**
     * Reactiva la cuenta de un cliente
     */
    @Post(':customerId/activate')
    @ApiOperation({ summary: 'Reactivar cuenta de cliente' })
    @ApiParam({ name: 'customerId', description: 'ID del cliente' })
    @ApiResponse({ status: 200, description: 'Cuenta reactivada' })
    async activateAccount(@Param('customerId') customerId: string) {
        return this.accountsService.activateAccount(customerId);
    }
}
