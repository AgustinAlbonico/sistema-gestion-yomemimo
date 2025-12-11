/**
 * Servicio de categorías de ingresos
 * Gestiona el CRUD de categorías para ingresos
 */
import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomeCategory } from './entities';
import { CreateIncomeCategoryDto, UpdateIncomeCategoryDto } from './dto';

@Injectable()
export class IncomeCategoriesService {
    constructor(
        @InjectRepository(IncomeCategory)
        private readonly categoryRepo: Repository<IncomeCategory>,
    ) { }

    /**
     * Crea una nueva categoría
     */
    async create(dto: CreateIncomeCategoryDto): Promise<IncomeCategory> {
        // Verificar que no exista una con el mismo nombre
        const existing = await this.categoryRepo.findOne({
            where: { name: dto.name },
            withDeleted: true,
        });

        if (existing) {
            if (existing.deletedAt) {
                // Restaurar si estaba eliminada
                await this.categoryRepo.restore(existing.id);
                return this.categoryRepo.save({
                    ...existing,
                    ...dto,
                    deletedAt: null,
                });
            }
            throw new ConflictException(`Ya existe una categoría con el nombre "${dto.name}"`);
        }

        const category = this.categoryRepo.create(dto);
        return this.categoryRepo.save(category);
    }

    /**
     * Obtiene todas las categorías
     */
    async findAll(): Promise<IncomeCategory[]> {
        return this.categoryRepo.find({
            order: { name: 'ASC' },
        });
    }

    /**
     * Obtiene solo las categorías activas
     */
    async findActive(): Promise<IncomeCategory[]> {
        return this.categoryRepo.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    /**
     * Obtiene una categoría por ID
     */
    async findOne(id: string): Promise<IncomeCategory> {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
        }
        return category;
    }

    /**
     * Actualiza una categoría
     */
    async update(id: string, dto: UpdateIncomeCategoryDto): Promise<IncomeCategory> {
        const category = await this.findOne(id);

        // Si cambia el nombre, verificar duplicados
        if (dto.name && dto.name !== category.name) {
            const existing = await this.categoryRepo.findOne({
                where: { name: dto.name },
            });
            if (existing) {
                throw new ConflictException(`Ya existe una categoría con el nombre "${dto.name}"`);
            }
        }

        Object.assign(category, dto);
        return this.categoryRepo.save(category);
    }

    /**
     * Elimina una categoría (soft delete)
     */
    async remove(id: string): Promise<{ message: string }> {
        await this.findOne(id);
        await this.categoryRepo.softDelete(id);
        return { message: 'Categoría eliminada correctamente' };
    }

    /**
     * Inicializa categorías por defecto
     */
    async seed(): Promise<{ created: number }> {
        const defaultCategories = [
            { name: 'Servicios Profesionales', description: 'Servicios de consultoría, asesoramiento, etc.' },
            { name: 'Alquileres', description: 'Ingresos por alquiler de espacios o equipos' },
            { name: 'Comisiones', description: 'Comisiones por ventas o intermediación' },
            { name: 'Reparaciones', description: 'Servicios de reparación y mantenimiento' },
            { name: 'Capacitaciones', description: 'Cursos, talleres y capacitaciones' },
            { name: 'Otros Ingresos', description: 'Ingresos varios no categorizados' },
        ];

        let created = 0;
        for (const cat of defaultCategories) {
            const exists = await this.categoryRepo.findOne({
                where: { name: cat.name },
                withDeleted: true,
            });
            if (!exists) {
                await this.categoryRepo.save(this.categoryRepo.create(cat));
                created++;
            }
        }

        return { created };
    }
}
