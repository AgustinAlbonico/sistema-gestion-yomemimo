/**
 * Controlador de Auditoría
 * Expone endpoints REST para consultar logs de auditoría
 */
import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { AuditService, PaginatedAuditLogs } from './audit.service';
import { AuditFiltersDto } from './dto';
import { AuditLog } from './entities';
import { AuditEntityType } from './enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    /**
     * Obtiene todos los logs de auditoría con filtros y paginación
     */
    @Get()
    @ApiOperation({ summary: 'Listar logs de auditoría' })
    @ApiResponse({ status: 200, description: 'Lista de logs paginada' })
    async findAll(@Query() filters: AuditFiltersDto): Promise<PaginatedAuditLogs> {
        return this.auditService.findAll(filters);
    }

    /**
     * Obtiene el historial de una entidad específica
     */
    @Get('entity/:type/:id')
    @ApiOperation({ summary: 'Historial de auditoría de una entidad' })
    @ApiParam({ name: 'type', enum: AuditEntityType, description: 'Tipo de entidad' })
    @ApiParam({ name: 'id', description: 'ID de la entidad' })
    @ApiResponse({ status: 200, description: 'Historial de la entidad' })
    async getByEntity(
        @Param('type') type: AuditEntityType,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<AuditLog[]> {
        return this.auditService.getByEntity(type, id);
    }

    /**
     * Obtiene la actividad de un usuario específico
     */
    @Get('user/:userId')
    @ApiOperation({ summary: 'Actividad de un usuario' })
    @ApiParam({ name: 'userId', description: 'ID del usuario' })
    @ApiResponse({ status: 200, description: 'Actividad del usuario paginada' })
    async getByUser(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Query() filters: AuditFiltersDto,
    ): Promise<PaginatedAuditLogs> {
        return this.auditService.getByUser(userId, filters);
    }
}
