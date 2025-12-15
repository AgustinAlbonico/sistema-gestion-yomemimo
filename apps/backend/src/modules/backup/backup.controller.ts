/**
 * Controlador de Backup
 * Endpoints para gestionar backups del sistema
 */
import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';

interface AuthenticatedRequest {
    user: {
        id: string;
        username: string;
    };
}

@Controller('backups')
@UseGuards(JwtAuthGuard)
export class BackupController {
    constructor(private readonly backupService: BackupService) { }

    /**
     * GET /api/backups - Listar todos los backups
     */
    @Get()
    async findAll() {
        return this.backupService.findAll();
    }

    /**
     * GET /api/backups/status - Estado del último backup (para alertas del dashboard)
     * Este endpoint no requiere autenticación para poder ser usado en el dashboard
     */
    @Get('status')
    async getBackupStatus() {
        return this.backupService.getBackupStatus();
    }

    /**
     * GET /api/backups/drives - Obtener unidades disponibles
     */
    @Get('drives')
    async getAvailableDrives() {
        const drives = await this.backupService.getAvailableDrives();
        return {
            drives,
            defaultPath: this.backupService.getDefaultPath(),
        };
    }

    /**
     * GET /api/backups/browse - Explorar directorios
     */
    @Get('browse')
    async browseDirectory(@Query('path') dirPath?: string) {
        return this.backupService.browseDirectory(dirPath);
    }

    /**
     * GET /api/backups/:id - Obtener un backup por ID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const backup = await this.backupService.findOne(id);
        if (!backup) {
            throw new HttpException('Backup no encontrado', HttpStatus.NOT_FOUND);
        }
        return backup;
    }

    /**
     * POST /api/backups - Crear un nuevo backup
     */
    @Post()
    async create(
        @Body() dto: CreateBackupDto,
        @Request() req: AuthenticatedRequest,
    ) {
        try {
            const backup = await this.backupService.create(dto, req.user?.username);
            return backup;
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Error al crear backup',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * DELETE /api/backups/:id - Eliminar un backup
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        try {
            await this.backupService.delete(id);
            return { message: 'Backup eliminado correctamente' };
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Error al eliminar backup',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
