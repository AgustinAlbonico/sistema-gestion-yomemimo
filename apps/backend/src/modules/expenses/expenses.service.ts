/**
 * Servicio de gastos
 * Gestiona el CRUD de gastos y estadísticas
 */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import {
    CreateExpenseDto,
    UpdateExpenseDto,
    ExpenseFiltersDto,
} from './dto';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { parseLocalDate } from '../../common/utils/date.utils';

export interface ExpenseStats {
    totalExpenses: number;
    totalAmount: number;
    totalPending: number;
    byCategory: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
        total: number;
    }>;
}

export interface PaginatedExpenses {
    data: Expense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class ExpensesService {
    constructor(
        @InjectRepository(Expense)
        private readonly expenseRepo: Repository<Expense>,
        @InjectRepository(ExpenseCategory)
        private readonly categoryRepo: Repository<ExpenseCategory>,
        private readonly cashRegisterService: CashRegisterService,
    ) { }

    /**
     * Crea un nuevo gasto
     */
    async create(dto: CreateExpenseDto, userId?: string): Promise<Expense> {
        // Si el gasto está pagado, validar que haya caja abierta
        const isPaidGasto = dto.isPaid !== undefined ? dto.isPaid : true;
        if (isPaidGasto) {
            const openCashRegister = await this.cashRegisterService.getOpenRegister();
            if (!openCashRegister) {
                throw new BadRequestException(
                    'No hay caja abierta. Debe abrir la caja antes de registrar gastos pagados.'
                );
            }
        }

        // Validar que la categoría existe si se proporciona
        let category: ExpenseCategory | null = null;
        if (dto.categoryId) {
            category = await this.categoryRepo.findOne({
                where: { id: dto.categoryId },
            });

            if (!category) {
                throw new NotFoundException('Categoría no encontrada');
            }
        }

        // Determinar fecha de pago
        const isPaid = dto.isPaid !== undefined ? dto.isPaid : true;
        let paidAt: Date | null = null;

        if (isPaid) {
            paidAt = dto.paidAt ? parseLocalDate(dto.paidAt) : parseLocalDate(dto.expenseDate);
        }

        const expense = this.expenseRepo.create({
            description: dto.description,
            amount: dto.amount,
            expenseDate: parseLocalDate(dto.expenseDate),
            category,
            categoryId: dto.categoryId ?? null,
            paymentMethodId: dto.paymentMethodId ?? null,
            receiptNumber: dto.receiptNumber ?? null,
            isPaid,
            paidAt,
            notes: dto.notes ?? null,
            createdById: userId ?? null,
        });

        const savedExpense = await this.expenseRepo.save(expense);

        // Registrar egreso en caja si está pagado (todos los métodos de pago)
        if (isPaid && dto.paymentMethodId) {
            console.log(`[ExpensesService] Intentando registrar egreso en caja para gasto ${savedExpense.id}`);
            try {
                await this.cashRegisterService.registerExpense(
                    {
                        expenseId: savedExpense.id,
                    },
                    userId || 'system'
                );
                console.log(`[ExpensesService] Egreso registrado en caja: ${dto.amount} (${dto.paymentMethodId})`);
            } catch (cashErr) {
                // Si falla el registro en caja, solo loguear el error
                // No queremos que falle el gasto por esto
                console.error(`[ExpensesService] ERROR al registrar egreso en caja:`, cashErr);
            }
        } else {
            console.log(`[ExpensesService] No se registra en caja. isPaid: ${isPaid}, paymentMethodId: ${dto.paymentMethodId}`);
        }

        return savedExpense;
    }

    /**
     * Obtiene gastos con filtros y paginación
     */
    async findAll(filters: ExpenseFiltersDto): Promise<PaginatedExpenses> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const skip = (page - 1) * limit;

        const query = this.expenseRepo
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.category', 'category')
            .leftJoinAndSelect('expense.paymentMethod', 'paymentMethod')
            .leftJoinAndSelect('expense.createdBy', 'user')
            .where('expense.deletedAt IS NULL');

        // Aplicar filtros
        if (filters.categoryId) {
            query.andWhere('expense.categoryId = :categoryId', {
                categoryId: filters.categoryId,
            });
        }

        if (filters.search) {
            query.andWhere('expense.description ILIKE :search', {
                search: `%${filters.search}%`,
            });
        }

        if (filters.startDate && filters.endDate) {
            query.andWhere('expense.expenseDate BETWEEN :start AND :end', {
                start: filters.startDate,
                end: filters.endDate,
            });
        } else if (filters.startDate) {
            query.andWhere('expense.expenseDate >= :start', {
                start: filters.startDate,
            });
        } else if (filters.endDate) {
            query.andWhere('expense.expenseDate <= :end', {
                end: filters.endDate,
            });
        }

        if (filters.isPaid !== undefined) {
            query.andWhere('expense.isPaid = :isPaid', {
                isPaid: filters.isPaid,
            });
        }

        // Ordenamiento
        const sortBy = filters.sortBy ?? 'expenseDate';
        const order = filters.order ?? 'DESC';
        query.orderBy(`expense.${sortBy}`, order);

        // Obtener total y datos paginados
        const [data, total] = await query
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Obtiene un gasto por ID
     */
    async findOne(id: string): Promise<Expense> {
        const expense = await this.expenseRepo.findOne({
            where: { id },
            relations: ['category', 'createdBy', 'paymentMethod'],
        });

        if (!expense) {
            throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
        }

        return expense;
    }

    /**
     * Actualiza un gasto
     */
    async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
        const expense = await this.findOne(id);

        // Manejar categoría (puede ser null para eliminar categoría)
        if (dto.categoryId !== undefined) {
            if (dto.categoryId === null || dto.categoryId === '') {
                // Eliminar categoría
                expense.category = null;
                expense.categoryId = null;
            } else if (dto.categoryId !== expense.categoryId) {
                // Cambiar categoría, validar que existe
                const category = await this.categoryRepo.findOne({
                    where: { id: dto.categoryId },
                });

                if (!category) {
                    throw new NotFoundException('Categoría no encontrada');
                }

                expense.category = category;
                expense.categoryId = dto.categoryId;
            }
        }

        // Actualizar campos
        if (dto.description !== undefined) expense.description = dto.description;
        if (dto.amount !== undefined) expense.amount = dto.amount;
        if (dto.expenseDate !== undefined) expense.expenseDate = parseLocalDate(dto.expenseDate);
        if (dto.paymentMethodId !== undefined) expense.paymentMethodId = dto.paymentMethodId ?? null;
        if (dto.receiptNumber !== undefined) expense.receiptNumber = dto.receiptNumber ?? null;
        if (dto.notes !== undefined) expense.notes = dto.notes ?? null;

        // Manejar estado de pago
        if (dto.isPaid !== undefined) {
            expense.isPaid = dto.isPaid;
            if (dto.isPaid && !expense.paidAt) {
                expense.paidAt = dto.paidAt ? parseLocalDate(dto.paidAt) : expense.expenseDate;
            } else if (!dto.isPaid) {
                expense.paidAt = null;
            }
        }

        return this.expenseRepo.save(expense);
    }

    /**
     * Elimina un gasto (soft delete)
     */
    async remove(id: string): Promise<{ message: string }> {
        const expense = await this.findOne(id);
        await this.expenseRepo.softDelete(expense.id);
        return { message: 'Gasto eliminado' };
    }

    /**
     * Marca un gasto pendiente como pagado y registra en caja
     */
    async markAsPaid(id: string, userId: string, paymentMethodId: string): Promise<Expense> {
        const expense = await this.findOne(id);

        if (expense.isPaid) {
            throw new BadRequestException('Este gasto ya está marcado como pagado');
        }

        // Asignar el método de pago seleccionado
        expense.paymentMethodId = paymentMethodId;

        // Verificar que hay caja abierta
        const openCashRegister = await this.cashRegisterService.getOpenRegister();
        if (!openCashRegister) {
            throw new BadRequestException(
                'No hay caja abierta. Debe abrir la caja antes de marcar gastos como pagados.'
            );
        }

        // Marcar como pagado con fecha/hora actual
        expense.isPaid = true;
        expense.paidAt = new Date();

        const savedExpense = await this.expenseRepo.save(expense);

        // Registrar egreso en caja
        try {
            await this.cashRegisterService.registerExpense(
                { expenseId: savedExpense.id },
                userId
            );
        } catch (cashErr) {
            // Si falla el registro en caja, revertir el cambio de estado
            expense.isPaid = false;
            expense.paidAt = null;
            await this.expenseRepo.save(expense);
            throw new BadRequestException(
                'Error al registrar el egreso en caja. El gasto no fue marcado como pagado.'
            );
        }

        return savedExpense;
    }

    /**
     * Obtiene estadísticas de gastos
     */
    async getStats(startDate?: string, endDate?: string): Promise<ExpenseStats> {
        const query = this.expenseRepo
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.category', 'category')
            .where('expense.deletedAt IS NULL');

        if (startDate && endDate) {
            query.andWhere('expense.expenseDate BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            });
        }

        const expenses = await query.getMany();

        const totalExpenses = expenses.length;

        const totalAmount = expenses
            .filter((e) => e.isPaid)
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const totalPending = expenses
            .filter((e) => !e.isPaid)
            .reduce((sum, e) => sum + Number(e.amount), 0);

        // Agrupar por categoría
        const categoryMap = new Map<string, { name: string; count: number; total: number }>();

        for (const expense of expenses.filter((e) => e.isPaid)) {
            const categoryId = expense.categoryId ?? 'uncategorized';
            const categoryName = expense.category?.name ?? 'Sin categoría';

            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, { name: categoryName, count: 0, total: 0 });
            }

            const cat = categoryMap.get(categoryId)!;
            cat.count++;
            cat.total += Number(expense.amount);
        }

        const byCategory = Array.from(categoryMap.entries())
            .map(([categoryId, data]) => ({
                categoryId,
                categoryName: data.name,
                count: data.count,
                total: data.total,
            }))
            .sort((a, b) => b.total - a.total);

        return {
            totalExpenses,
            totalAmount,
            totalPending,
            byCategory,
        };
    }
}

