import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxType } from '../entities/tax-type.entity';
import { CreateTaxTypeDto } from '../dto/create-tax-type.dto';

@Injectable()
export class TaxTypesService {
    constructor(
        @InjectRepository(TaxType)
        private readonly taxTypeRepo: Repository<TaxType>,
    ) { }

    async findAll(): Promise<TaxType[]> {
        return this.taxTypeRepo.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async create(createTaxTypeDto: CreateTaxTypeDto): Promise<TaxType> {
        const taxType = this.taxTypeRepo.create({
            ...createTaxTypeDto,
            isActive: true,
        });
        return this.taxTypeRepo.save(taxType);
    }
}
