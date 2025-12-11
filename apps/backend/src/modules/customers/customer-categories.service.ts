/**
 * Servicio de categorías de clientes
 * Gestiona la clasificación de clientes
 */
import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { CustomerCategoriesRepository } from './customer-categories.repository';
import { CreateCustomerCategoryDTO, UpdateCustomerCategoryDTO } from './dto';
import { generateColorFromName } from '../../common/utils/color.utils';

@Injectable()
export class CustomerCategoriesService {
    constructor(
        private readonly categoriesRepository: CustomerCategoriesRepository,
    ) {}

    /**
     * Crea una nueva categoría
     */
    async create(dto: CreateCustomerCategoryDTO) {
        // Validar nombre único
        const existing = await this.categoriesRepository.findByName(dto.name);
        if (existing) {
            throw new ConflictException('Ya existe una categoría con ese nombre');
        }

        // Asignar color aleatorio si no se proporciona
        const categoryData = {
            ...dto,
            color: dto.color || generateColorFromName(dto.name),
        };

        const category = this.categoriesRepository.create(categoryData);
        return this.categoriesRepository.save(category);
    }

    /**
     * Lista todas las categorías
     */
    async findAll() {
        return this.categoriesRepository.find({
            order: { name: 'ASC' },
        });
    }

    /**
     * Lista categorías activas
     */
    async findActive() {
        return this.categoriesRepository.findActiveCategories();
    }

    /**
     * Obtiene una categoría por ID
     */
    async findOne(id: string) {
        const category = await this.categoriesRepository.findOne({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException('Categoría no encontrada');
        }

        return category;
    }

    /**
     * Actualiza una categoría
     */
    async update(id: string, dto: UpdateCustomerCategoryDTO) {
        const category = await this.findOne(id);

        // Validar nombre único si se modifica
        if (dto.name && dto.name !== category.name) {
            const existing = await this.categoriesRepository.findByName(dto.name);
            if (existing) {
                throw new ConflictException('Ya existe una categoría con ese nombre');
            }
        }

        Object.assign(category, dto);
        return this.categoriesRepository.save(category);
    }

    /**
     * Elimina una categoría
     * Solo si no tiene clientes asociados
     */
    async remove(id: string) {
        const category = await this.findOne(id);

        // Verificar si tiene clientes asociados
        const customerCount = await this.categoriesRepository.countCustomersByCategory(id);
        if (customerCount > 0) {
            throw new ConflictException(
                `No se puede eliminar una categoría con ${customerCount} cliente(s) asociado(s)`,
            );
        }

        await this.categoriesRepository.remove(category);
        return { message: 'Categoría eliminada exitosamente' };
    }
}

