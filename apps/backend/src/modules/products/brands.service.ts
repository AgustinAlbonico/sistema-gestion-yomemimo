import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import { CreateBrandDTO } from './dto/create-brand.dto';
import { Brand } from './entities/brand.entity';
import { ILike } from 'typeorm';

@Injectable()
export class BrandsService {
    constructor(private readonly brandsRepository: BrandsRepository) { }

    /**
     * Busca o crea una marca por nombre.
     */
    async findOrCreate(name: string): Promise<Brand> {
        if (!name || name.trim().length === 0) {
            throw new ConflictException('El nombre de la marca no puede estar vacío');
        }
        return this.brandsRepository.findOrCreateByName(name);
    }

    /**
     * Crea una marca.
     */
    async create(dto: CreateBrandDTO): Promise<Brand> {
        return this.findOrCreate(dto.name);
    }

    /**
     * Busca marcas para autocomplete.
     */
    async search(query: string): Promise<Brand[]> {
        return this.brandsRepository.searchByName(query);
    }

    /**
     * Lista todas las marcas.
     */
    async findAll(): Promise<Brand[]> {
        return this.brandsRepository.find({
            order: { name: 'ASC' },
        });
    }

    /**
     * Obtiene una marca por ID.
     */
    async findOne(id: string): Promise<Brand> {
        const brand = await this.brandsRepository.findOne({
            where: { id },
        });

        if (!brand) {
            throw new NotFoundException('Marca no encontrada');
        }

        return brand;
    }

    /**
     * Obtiene el conteo de productos de una marca.
     */
    async getProductCount(id: string): Promise<{ count: number }> {
        await this.findOne(id); // Verifica que existe
        const count = await this.brandsRepository.countProducts(id);
        return { count };
    }

    /**
     * Actualiza el nombre de una marca.
     */
    async update(id: string, name: string): Promise<Brand> {
        const brand = await this.findOne(id);
        const trimmedName = name.trim();

        if (!trimmedName) {
            throw new BadRequestException('El nombre de la marca no puede estar vacío');
        }

        // Verificar que no existe otra marca con ese nombre
        const existing = await this.brandsRepository.findOne({
            where: { name: ILike(trimmedName) },
        });

        if (existing && existing.id !== id) {
            throw new ConflictException('Ya existe una marca con ese nombre');
        }

        brand.name = trimmedName;
        return this.brandsRepository.save(brand);
    }

    /**
     * Elimina una marca. Los productos quedan sin marca.
     */
    async remove(id: string): Promise<{ message: string; productsAffected: number }> {
        const brand = await this.findOne(id);

        // Contar productos afectados
        const productsAffected = await this.brandsRepository.countProducts(id);

        // Desasociar productos de esta marca
        if (productsAffected > 0) {
            await this.brandsRepository.removeProductsAssociation(id);
        }

        // Eliminar la marca
        await this.brandsRepository.remove(brand);

        return {
            message: 'Marca eliminada exitosamente',
            productsAffected
        };
    }
}
