/**
 * DTO para crear un backup
 */
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateBackupDto {
    @IsOptional()
    @IsString()
    destinationPath?: string;

    @IsOptional()
    @IsBoolean()
    includeTimestamp?: boolean;
}
