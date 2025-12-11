/**
 * Controlador de categorías de ingresos
 * Endpoints REST para gestión de categorías
 */
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IncomeCategoriesService } from './income-categories.service';
import { CreateIncomeCategoryDto, UpdateIncomeCategoryDto } from './dto';

@ApiTags('Income Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('income-categories')
export class IncomeCategoriesController {
    constructor(private readonly categoriesService: IncomeCategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Crear categoría de ingreso' })
    create(@Body() dto: CreateIncomeCategoryDto) {
        return this.categoriesService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas las categorías' })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get('active')
    @ApiOperation({ summary: 'Listar categorías activas' })
    findActive() {
        return this.categoriesService.findActive();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener categoría por ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar categoría' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateIncomeCategoryDto,
    ) {
        return this.categoriesService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar categoría' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.remove(id);
    }

    @Post('seed')
    @ApiOperation({ summary: 'Inicializar categorías por defecto' })
    seed() {
        return this.categoriesService.seed();
    }
}
