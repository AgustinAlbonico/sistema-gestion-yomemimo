import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from './categories.repository';
import {
    CreateProductDTO,
    UpdateProductDTO,
    QueryProductsDTO,
} from './dto';

import { ConfigurationService } from '../configuration/configuration.service';

/**
 * Servicio de productos simplificado
 * - Calcula precio automáticamente según % de configuración
 */
@Injectable()
export class ProductsService {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly categoriesRepository: CategoriesRepository,
        private readonly configService: ConfigurationService,
    ) { }

    async create(dto: CreateProductDTO) {
        // Validar que la categoría existe si se proporciona
        if (dto.categoryId) {
            const category = await this.categoriesRepository.findOne({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException('Categoría no encontrada');
            }
        }

        // Obtener margen de ganancia de configuración
        const profitMargin = await this.configService.getDefaultProfitMargin();

        // Calcular precio automáticamente
        const price = this.calculatePrice(dto.cost, profitMargin);

        const product = this.productsRepository.create({
            name: dto.name,
            cost: dto.cost,
            price,
            profitMargin,
            stock: dto.stock ?? 0,
            categoryId: dto.categoryId,
            isActive: dto.isActive ?? true,
        });

        return this.productsRepository.save(product);
    }

    async findAll(filters: QueryProductsDTO) {
        const [data, total] = await this.productsRepository.findWithFilters(filters);

        return {
            data,
            total,
            page: filters.page,
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit),
        };
    }

    async findOne(id: string) {
        const product = await this.productsRepository.findOne({
            where: { id },
            relations: ['category'],
        });

        if (!product) {
            throw new NotFoundException('Producto no encontrado');
        }

        return product;
    }

    async update(id: string, dto: UpdateProductDTO) {
        const product = await this.findOne(id);

        // Validar categoría si se modifica
        if (dto.categoryId && dto.categoryId !== product.categoryId) {
            const category = await this.categoriesRepository.findOne({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException('Categoría no encontrada');
            }
        }

        // Si cambia el costo, recalcular precio
        if (dto.cost !== undefined && dto.cost !== product.cost) {
            const profitMargin = await this.configService.getDefaultProfitMargin();
            product.price = this.calculatePrice(dto.cost, profitMargin);
            product.profitMargin = profitMargin;
        }

        // Actualizar campos
        if (dto.name !== undefined) product.name = dto.name;
        if (dto.cost !== undefined) product.cost = dto.cost;
        if (dto.stock !== undefined) product.stock = dto.stock;
        if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
        if (dto.isActive !== undefined) product.isActive = dto.isActive;

        return this.productsRepository.save(product);
    }

    async remove(id: string) {
        const product = await this.findOne(id);

        // Soft delete - solo marcar como inactivo
        product.isActive = false;
        await this.productsRepository.save(product);

        return { message: 'Producto eliminado' };
    }

    private calculatePrice(cost: number, profitMargin: number): number {
        const price = cost * (1 + profitMargin / 100);
        return Math.round(price * 100) / 100;
    }
}
