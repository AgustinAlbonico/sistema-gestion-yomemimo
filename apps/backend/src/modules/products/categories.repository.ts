import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesRepository extends Repository<Category> {
    constructor(private dataSource: DataSource) {
        super(Category, dataSource.createEntityManager());
    }

    async findActiveCategories(): Promise<Category[]> {
        return this.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async findByName(name: string): Promise<Category | null> {
        return this.findOne({ where: { name } });
    }
}
