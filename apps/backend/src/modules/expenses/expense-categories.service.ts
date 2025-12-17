/**
 * Servicio de categorías de gastos
 * Gestiona el CRUD de categorías y la inicialización con datos por defecto
 */
import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategory } from './entities/expense-category.entity';
import {
    CreateExpenseCategoryDto,
    UpdateExpenseCategoryDto,
} from './dto';

@Injectable()
export class ExpenseCategoriesService {
    constructor(
        @InjectRepository(ExpenseCategory)
        private readonly categoryRepo: Repository<ExpenseCategory>,
    ) { }

    /**
     * Crea una nueva categoría de gasto
     */
    async create(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
        // Verificar que no existe una categoría con ese nombre
        const existing = await this.categoryRepo.findOne({
            where: { name: dto.name },
        });

        if (existing) {
            throw new ConflictException('Ya existe una categoría con ese nombre');
        }

        const category = this.categoryRepo.create({
            name: dto.name,
            description: dto.description ?? undefined,
            isRecurring: dto.isRecurring ?? false,
        });

        return this.categoryRepo.save(category);
    }

    /**
     * Obtiene todas las categorías activas
     */
    async findAll(): Promise<ExpenseCategory[]> {
        return this.categoryRepo.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    /**
     * Obtiene una categoría por ID
     */
    async findOne(id: string): Promise<ExpenseCategory> {
        const category = await this.categoryRepo.findOne({ where: { id } });

        if (!category) {
            throw new NotFoundException('Categoría no encontrada');
        }

        return category;
    }

    /**
     * Actualiza una categoría de gasto
     */
    async update(
        id: string,
        dto: UpdateExpenseCategoryDto,
    ): Promise<ExpenseCategory> {
        const category = await this.findOne(id);

        // Si cambia el nombre, verificar que no exista otra con ese nombre
        if (dto.name && dto.name !== category.name) {
            const existing = await this.categoryRepo.findOne({
                where: { name: dto.name },
            });

            if (existing) {
                throw new ConflictException('Ya existe una categoría con ese nombre');
            }
        }

        // Actualizar campos
        if (dto.name !== undefined) category.name = dto.name;
        if (dto.description !== undefined) category.description = dto.description ?? null;
        if (dto.isRecurring !== undefined) category.isRecurring = dto.isRecurring;

        return this.categoryRepo.save(category);
    }

    /**
     * Elimina una categoría (soft delete)
     */
    async remove(id: string): Promise<{ message: string }> {
        const category = await this.findOne(id);
        category.isActive = false;
        await this.categoryRepo.save(category);
        return { message: 'Categoría eliminada' };
    }

    /**
     * Inicializa categorías por defecto
     */
    async seed(): Promise<{ message: string; created: number }> {
        const defaultCategories = [
            { name: 'Alquiler', description: 'Alquiler del local', isRecurring: true },
            { name: 'Servicios', description: 'Luz, agua, gas, internet', isRecurring: true },
            { name: 'Salarios', description: 'Sueldos del personal', isRecurring: true },
            { name: 'Impuestos', description: 'Impuestos varios', isRecurring: true },
            { name: 'Mantenimiento', description: 'Reparaciones y mantenimiento', isRecurring: false },
            { name: 'Publicidad', description: 'Gastos de marketing y publicidad', isRecurring: false },
            { name: 'Transporte', description: 'Combustible, transporte', isRecurring: false },
            { name: 'Seguros', description: 'Seguros varios', isRecurring: true },
            { name: 'Insumos', description: 'Materiales e insumos de oficina', isRecurring: false },
            { name: 'Otros', description: 'Gastos varios no categorizados', isRecurring: false },
        ];

        let created = 0;

        for (const cat of defaultCategories) {
            const existing = await this.categoryRepo.findOne({
                where: { name: cat.name },
            });

            if (!existing) {
                await this.categoryRepo.save(this.categoryRepo.create(cat));
                created++;
            }
        }

        return {
            message: `Categorías inicializadas correctamente`,
            created,
        };
    }
}

