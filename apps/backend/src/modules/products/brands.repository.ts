import { Injectable } from '@nestjs/common';
import { DataSource, Repository, ILike } from 'typeorm';
import { Brand } from './entities/brand.entity';

@Injectable()
export class BrandsRepository extends Repository<Brand> {
    constructor(private readonly dataSource: DataSource) {
        super(Brand, dataSource.createEntityManager());
    }

    /**
     * Busca una marca por nombre (case-insensitive) o la crea si no existe.
     */
    async findOrCreateByName(name: string): Promise<Brand> {
        const trimmedName = name.trim();

        let brand = await this.findOne({
            where: { name: ILike(trimmedName) },
        });

        if (!brand) {
            brand = this.create({ name: trimmedName });
            await this.save(brand);
        }

        return brand;
    }

    /**
     * Busca marcas por nombre (parcial, case-insensitive) para autocomplete.
     */
    async searchByName(query: string, limit = 10): Promise<Brand[]> {
        if (!query || query.trim().length === 0) {
            return this.find({
                order: { name: 'ASC' },
                take: limit,
            });
        }

        return this.createQueryBuilder('brand')
            .where('LOWER(brand.name) LIKE :query', {
                query: `%${query.toLowerCase()}%`,
            })
            .orderBy('brand.name', 'ASC')
            .take(limit)
            .getMany();
    }

    /**
     * Cuenta cuántos productos tiene una marca.
     */
    async countProducts(brandId: string): Promise<number> {
        const brand = await this.findOne({
            where: { id: brandId },
            relations: ['products'],
        });
        return brand?.products?.length ?? 0;
    }

    /**
     * Desasocia todos los productos de una marca (pone brandId = null).
     */
    async removeProductsAssociation(brandId: string): Promise<void> {
        await this.dataSource
            .createQueryBuilder()
            .update('products')
            .set({ brandId: null })
            .where('brandId = :brandId', { brandId })
            .execute();
    }
}
