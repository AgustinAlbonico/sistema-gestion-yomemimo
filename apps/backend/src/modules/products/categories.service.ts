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

@Injectable()
export class CategoriesService {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
        @Inject(forwardRef(() => ProductsService))
        private readonly productsService: ProductsService,
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

    async remove(id: string) {
        const category = await this.findOne(id);

        await this.categoriesRepository.remove(category);

        return { message: 'Categoría eliminada exitosamente' };
    }
}
