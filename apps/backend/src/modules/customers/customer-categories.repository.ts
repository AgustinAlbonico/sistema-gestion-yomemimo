/**
 * Repositorio de categorías de clientes
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { CustomerCategory } from './entities/customer-category.entity';

@Injectable()
export class CustomerCategoriesRepository extends Repository<CustomerCategory> {
    constructor(private dataSource: DataSource) {
        super(CustomerCategory, dataSource.createEntityManager());
    }

    /**
     * Lista categorías activas ordenadas por nombre
     */
    async findActiveCategories(): Promise<CustomerCategory[]> {
        return this.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    /**
     * Busca categoría por nombre
     */
    async findByName(name: string): Promise<CustomerCategory | null> {
        return this.findOne({ where: { name } });
    }

    /**
     * Busca categorías por múltiples IDs
     */
    async findByIds(ids: string[]): Promise<CustomerCategory[]> {
        return this.find({
            where: { id: In(ids) },
        });
    }

    /**
     * Cuenta clientes por categoría
     */
    async countCustomersByCategory(categoryId: string): Promise<number> {
        const result = await this.createQueryBuilder('category')
            .leftJoin('category.customers', 'customer')
            .where('category.id = :categoryId', { categoryId })
            .select('COUNT(customer.id)', 'count')
            .getRawOne();

        return parseInt(result?.count || '0');
    }
}

