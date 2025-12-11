/**
 * Controlador de categorías de clientes
 * Endpoints para gestión de clasificación de clientes
 */
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomerCategoriesService } from './customer-categories.service';
import {
    CreateCustomerCategoryDto,
    UpdateCustomerCategoryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('customer-categories')
@Controller('customer-categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerCategoriesController {
    constructor(private readonly categoriesService: CustomerCategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Crear nueva categoría de cliente' })
    @ApiResponse({ status: 201, description: 'Categoría creada exitosamente' })
    @ApiResponse({ status: 409, description: 'Nombre duplicado' })
    create(@Body() dto: CreateCustomerCategoryDto) {
        return this.categoriesService.create({
            ...dto,
            isActive: dto.isActive ?? true,
        });
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas las categorías' })
    @ApiResponse({ status: 200, description: 'Lista de categorías' })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get('active')
    @ApiOperation({ summary: 'Listar categorías activas' })
    @ApiResponse({ status: 200, description: 'Lista de categorías activas' })
    findActive() {
        return this.categoriesService.findActive();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener categoría por ID' })
    @ApiResponse({ status: 200, description: 'Categoría encontrada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar categoría' })
    @ApiResponse({ status: 200, description: 'Categoría actualizada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    @ApiResponse({ status: 409, description: 'Nombre duplicado' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCustomerCategoryDto,
    ) {
        return this.categoriesService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar categoría' })
    @ApiResponse({ status: 200, description: 'Categoría eliminada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    @ApiResponse({ status: 409, description: 'Categoría tiene clientes asociados' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.remove(id);
    }
}

