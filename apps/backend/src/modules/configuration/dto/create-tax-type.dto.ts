import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, MaxLength } from 'class-validator';

export class CreateTaxTypeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    percentage?: number;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;
}
