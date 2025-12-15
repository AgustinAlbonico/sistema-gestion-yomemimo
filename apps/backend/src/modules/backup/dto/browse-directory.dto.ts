/**
 * DTO para explorar directorios
 */
import { IsOptional, IsString } from 'class-validator';

export class BrowseDirectoryDto {
    @IsOptional()
    @IsString()
    path?: string;
}
