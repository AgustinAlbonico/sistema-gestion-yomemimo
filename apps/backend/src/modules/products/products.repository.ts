import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { QueryProductsDTO } from './dto/query-products.dto';

@Injectable()
export class ProductsRepository extends Repository<Product> {
    constructor(private readonly dataSource: DataSource) {
        super(Product, dataSource.createEntityManager());
    }

    async findWithFilters(
        filters: QueryProductsDTO,
        minStockAlert?: number,
    ): Promise<[Product[], number]> {
        const { page, limit, search, categoryId, isActive, stockStatus, sortBy, order } = filters;

        const query = this.createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.brand', 'brand');

        // Búsqueda por texto
        if (search) {
            query.andWhere(
                '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        // Filtro por categoría
        if (categoryId) {
            query.andWhere('product.categoryId = :categoryId', { categoryId });
        }

        // Filtro por estado
        if (isActive !== undefined) {
            query.andWhere('product.isActive = :isActive', { isActive });
        }

        // Filtro por stock crítico (sin stock o bajo stock)
        if (stockStatus === 'critical' && minStockAlert !== undefined) {
            query.andWhere('product.stock <= :minStock', { minStock: minStockAlert });
        }

        // Ordenamiento
        query.orderBy(`product.${sortBy}`, order);

        // Paginación
        query.skip((page - 1) * limit).take(limit);

        return query.getManyAndCount();
    }

    async findByBarcode(barcode: string): Promise<Product | null> {
        return this.findOne({ where: { barcode } });
    }

    async findBySku(sku: string): Promise<Product | null> {
        return this.findOne({ where: { sku } });
    }

    async findActiveProducts(): Promise<Product[]> {
        return this.find({
            where: { isActive: true },
            relations: ['category'],
            order: { name: 'ASC' },
        });
    }
}

