import { Controller, Get, Post, Body } from '@nestjs/common';
import { TaxTypesService } from '../services/tax-types.service';
import { TaxType } from '../entities/tax-type.entity';
import { CreateTaxTypeDto } from '../dto/create-tax-type.dto';

@Controller('configuration/tax-types')
export class TaxTypesController {
    constructor(private readonly taxTypesService: TaxTypesService) { }

    @Get()
    async findAll(): Promise<TaxType[]> {
        return this.taxTypesService.findAll();
    }

    @Post()
    async create(@Body() createTaxTypeDto: CreateTaxTypeDto): Promise<TaxType> {
        return this.taxTypesService.create(createTaxTypeDto);
    }
}
