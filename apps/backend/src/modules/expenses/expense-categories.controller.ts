/**
 * Controlador de categorías de gastos
 * Expone endpoints REST para gestionar categorías
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
import { ExpenseCategoriesService } from './expense-categories.service';
import {
    CreateExpenseCategoryDto,
    UpdateExpenseCategoryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('expense-categories')
@Controller('expense-categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpenseCategoriesController {
    constructor(
        private readonly categoriesService: ExpenseCategoriesService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Crear categoría de gasto' })
    @ApiResponse({ status: 201, description: 'Categoría creada' })
    @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
    create(@Body() dto: CreateExpenseCategoryDto) {
        return this.categoriesService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar categorías activas' })
    @ApiResponse({ status: 200, description: 'Lista de categorías' })
    findAll() {
        return this.categoriesService.findAll();
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
    @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateExpenseCategoryDto,
    ) {
        return this.categoriesService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar categoría' })
    @ApiResponse({ status: 200, description: 'Categoría eliminada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.remove(id);
    }

    @Post('seed')
    @ApiOperation({ summary: 'Inicializar categorías por defecto' })
    @ApiResponse({ status: 201, description: 'Categorías inicializadas' })
    seed() {
        return this.categoriesService.seed();
    }
}

