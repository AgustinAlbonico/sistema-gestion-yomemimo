import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    @Get('search')
    @ApiOperation({ summary: 'Buscar marcas por nombre (autocomplete)' })
    @ApiQuery({ name: 'q', required: false, description: 'Texto a buscar' })
    @ApiResponse({ status: 200, description: 'Lista de marcas que coinciden' })
    search(@Query('q') query: string) {
        return this.brandsService.search(query || '');
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas las marcas' })
    findAll() {
        return this.brandsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una marca por ID' })
    findOne(@Param('id') id: string) {
        return this.brandsService.findOne(id);
    }

    @Get(':id/product-count')
    @ApiOperation({ summary: 'Obtener cantidad de productos de una marca' })
    @ApiResponse({ status: 200, description: 'Conteo de productos' })
    getProductCount(@Param('id') id: string) {
        return this.brandsService.getProductCount(id);
    }

    @Post()
    @ApiOperation({ summary: 'Crear o obtener marca existente' })
    @ApiResponse({ status: 201, description: 'Marca creada o encontrada' })
    create(@Body() createBrandDto: CreateBrandDto) {
        return this.brandsService.create(createBrandDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar nombre de una marca' })
    @ApiResponse({ status: 200, description: 'Marca actualizada' })
    update(@Param('id') id: string, @Body() body: { name: string }) {
        return this.brandsService.update(id, body.name);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar una marca (productos quedan sin marca)' })
    @ApiResponse({ status: 200, description: 'Marca eliminada' })
    remove(@Param('id') id: string) {
        return this.brandsService.remove(id);
    }
}
