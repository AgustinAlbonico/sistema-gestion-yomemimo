/**
 * Controlador de clientes
 * Expone endpoints REST para gestión de clientes
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
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
    CreateCustomerDto,
    UpdateCustomerDto,
    QueryCustomersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @ApiOperation({ summary: 'Crear nuevo cliente' })
    @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 409, description: 'Documento o email duplicado' })
    create(@Body() dto: CreateCustomerDto) {
        return this.customersService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar clientes con filtros' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'categoryId', required: false, type: String })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'city', required: false, type: String })
    @ApiQuery({ name: 'state', required: false, type: String })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['firstName', 'lastName', 'email', 'createdAt'],
    })
    @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
    @ApiResponse({ status: 200, description: 'Lista de clientes paginada' })
    findAll(@Query() query: QueryCustomersDto) {
        // Aplicar defaults si no vienen
        const filters = {
            ...query,
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sortBy || 'lastName',
            order: query.order || 'ASC',
        };
        return this.customersService.findAll(filters);
    }

    @Get('active')
    @ApiOperation({ summary: 'Listar clientes activos (para selectores)' })
    @ApiResponse({ status: 200, description: 'Lista de clientes activos' })
    getActiveCustomers() {
        return this.customersService.getActiveCustomers();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de clientes' })
    @ApiResponse({ status: 200, description: 'Estadísticas de clientes' })
    getStats() {
        return this.customersService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener cliente por ID' })
    @ApiResponse({ status: 200, description: 'Cliente encontrado' })
    @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.customersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar cliente' })
    @ApiResponse({ status: 200, description: 'Cliente actualizado' })
    @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
    @ApiResponse({ status: 409, description: 'Documento o email duplicado' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCustomerDto,
    ) {
        return this.customersService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Desactivar cliente (soft delete)' })
    @ApiResponse({ status: 200, description: 'Cliente desactivado' })
    @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.customersService.remove(id);
    }
}

