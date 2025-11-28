import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDTO, UpdateCategoryDTO } from './dto';

@Injectable()
export class CategoriesService {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
    ) { }

    async create(dto: CreateCategoryDTO) {
        // Validar nombre único
        const existing = await this.categoriesRepository.findByName(dto.name);
        if (existing) {
            throw new ConflictException('Ya existe una categoría con ese nombre');
        }

        const category = this.categoriesRepository.create(dto);
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

        Object.assign(category, dto);
        return this.categoriesRepository.save(category);
    }

    async remove(id: string) {
        const category = await this.findOne(id);

        // Soft delete
        category.isActive = false;
        await this.categoriesRepository.save(category);

        return { message: 'Categoría desactivada exitosamente' };
    }
}
