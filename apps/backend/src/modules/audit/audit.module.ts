/**
 * Módulo de Auditoría
 * Provee funcionalidad de auditoría centralizada para operaciones financieras
 */
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global() // Hacemos el módulo global para que el AuditService esté disponible en todos los módulos
@Module({
    imports: [TypeOrmModule.forFeature([AuditLog])],
    controllers: [AuditController],
    providers: [AuditService],
    exports: [AuditService],
})
export class AuditModule { }
