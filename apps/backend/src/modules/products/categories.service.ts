import {
    Injectable,
    NotFoundException,
    ConflictException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDTO, UpdateCategoryDTO } from './dto';
import { generateColorFromName } from '../../common/utils/color.utils';
import { ProductsService } from './products.service';
import { CategoryDeletionPreviewDTO } from './dto/category-deletion-preview.dto';
import { DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class CategoriesService {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
        @Inject(forwardRef(() => ProductsService))
        private readonly productsService: ProductsService,
        private readonly configService: ConfigurationService,
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateCategoryDTO) {
        // Validar nombre único
        const existing = await this.categoriesRepository.findByName(dto.name);
        if (existing) {
            throw new ConflictException('Ya existe una categoría con ese nombre');
        }

        // Asignar color automáticamente si no se proporciona
        const categoryData = {
            ...dto,
            color: dto.color || generateColorFromName(dto.name),
            profitMargin: dto.profitMargin ?? null,
        };

        const category = this.categoriesRepository.create(categoryData);
        return this.categoriesRepository.save(category);
    }

    async findAll() {
        return this.categoriesRepository.find({
            order: { name: 'ASC' },
        });
    }

    async findActive() {
        return this.categoriesRepository.findActiveCategories();
    }

    async findOne(id: string) {
        const category = await this.categoriesRepository.findOne({
            where: { id },
            relations: ['products'],
        });

        if (!category) {
            throw new NotFoundException('Categoría no encontrada');
        }

        return category;
    }

    async update(id: string, dto: UpdateCategoryDTO) {
        const category = await this.findOne(id);

        if (dto.name && dto.name !== category.name) {
            const existing = await this.categoriesRepository.findByName(dto.name);
            if (existing) {
                throw new ConflictException('Ya existe una categoría con ese nombre');
            }
        }

        // Verificar si cambió el margen de ganancia
        const marginChanged = dto.profitMargin !== undefined && dto.profitMargin !== category.profitMargin;

        Object.assign(category, dto);
        const savedCategory = await this.categoriesRepository.save(category);

        // Si cambió el margen, recalcular precios de productos de esta categoría
        if (marginChanged) {
            await this.productsService.recalculateProductsByCategory(
                id,
                savedCategory.profitMargin,
            );
        }

        return savedCategory;
    }

    async getDeletionPreview(id: string): Promise<CategoryDeletionPreviewDTO> {
        const category = await this.findOne(id);

        const productRepo = this.dataSource.getRepository(Product);

        const [productCount, affectedProductsCount, globalMargin] = await Promise.all([
            productRepo.count({ where: { categoryId: id } }),
            productRepo.count({ where: { categoryId: id, useCustomMargin: false } }),
            this.configService.getDefaultProfitMargin(),
        ]);

        return {
            productCount,
            affectedProductsCount,
            globalMargin,
        };
    }

    async remove(id: string) {
        const category = await this.findOne(id);
        const globalMargin = await this.configService.getDefaultProfitMargin();

        if (isNaN(globalMargin) || globalMargin < 0) {
            throw new ConflictException('El margen global del sistema no es válido');
        }

        // Ejecutar en transacción para asegurar consistencia
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            const productRepo = transactionalEntityManager.getRepository(Product);

            // 1. Actualizar productos que NO tienen margen personalizado
            // Estos productos heredarán el margen global y se recalculará su precio
            await productRepo
                .createQueryBuilder()
                .update(Product)
                .set({
                    categoryId: null,
                    profitMargin: globalMargin,
                    // Recalcular precio: precio = costo * (1 + margin/100)
                    // Usamos una expresión SQL para asegurar precisión y evitar overflows de JS
                    price: () => `ROUND(cost * (1 + ${globalMargin} / 100), 2)`,
                    updatedAt: new Date(),
                })
                .where('categoryId = :id', { id })
                .andWhere('useCustomMargin = :useCustomMargin', { useCustomMargin: false })
                .execute();

            // 2. Actualizar productos que SÍ tienen margen personalizado
            // Solo quitamos la categoría, mantenemos su margen y precio actual
            await productRepo
                .createQueryBuilder()
                .update(Product)
                .set({
                    categoryId: null,
                    updatedAt: new Date(),
                })
                .where('categoryId = :id', { id })
                .andWhere('useCustomMargin = :useCustomMargin', { useCustomMargin: true })
                .execute();

            // 3. Eliminar la categoría
            await transactionalEntityManager.remove(category);
        });

        return { message: 'Categoría eliminada exitosamente y productos actualizados' };
    }
}
