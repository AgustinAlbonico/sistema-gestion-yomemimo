import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { IsString, Length } from 'class-validator';

export const CreateBrandSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
});

export type CreateBrandDTO = z.infer<typeof CreateBrandSchema>;

export class CreateBrandDto {
    @ApiProperty({ example: 'Sedal', description: 'Nombre de la marca' })
    @IsString()
    @Length(1, 100)
    name!: string;
}
