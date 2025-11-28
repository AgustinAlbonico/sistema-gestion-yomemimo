import { Controller, Get, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controlador de configuración del sistema
 */
@ApiTags('configuration')
@Controller('configuration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConfigurationController {
    constructor(private readonly configService: ConfigurationService) { }

    @Get()
    @ApiOperation({ summary: 'Obtener configuración del sistema' })
    getConfiguration() {
        return this.configService.getConfiguration();
    }

    @Patch()
    @ApiOperation({ summary: 'Actualizar configuración del sistema' })
    updateConfiguration(@Body() updateDto: UpdateConfigurationDto) {
        return this.configService.updateConfiguration(updateDto);
    }

    @Post('update-all-prices')
    @ApiOperation({ summary: 'Actualizar precio de todos los productos según el % de ganancia' })
    @ApiResponse({ status: 200, description: 'Productos actualizados' })
    updateAllPrices() {
        return this.configService.updateAllProductsPrices();
    }
}
