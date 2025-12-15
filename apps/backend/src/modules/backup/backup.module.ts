/**
 * Módulo de Backup
 * Gestiona copias de seguridad de la base de datos
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { Backup } from './entities/backup.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Backup])],
    controllers: [BackupController],
    providers: [BackupService],
    exports: [BackupService],
})
export class BackupModule { }
