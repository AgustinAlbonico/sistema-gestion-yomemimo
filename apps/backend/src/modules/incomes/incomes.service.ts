/**
 * Servicio de ingresos
 * Gestiona el CRUD de ingresos y estadísticas
 */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income, IncomeCategory } from './entities';
import {
    CreateIncomeDto,
    UpdateIncomeDto,
    IncomeFiltersDto,
} from './dto';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomerAccountsService } from '../customer-accounts/customer-accounts.service';
import { parseLocalDate } from '../../common/utils/date.utils';

interface IncomeStats {
    totalIncomes: number;
    totalAmount: number;
    totalPending: number;
    byCategory: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
        total: number;
    }>;
}

interface PaginatedIncomes {
    data: Income[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class IncomesService {
    constructor(
        @InjectRepository(Income)
        private readonly incomeRepo: Repository<Income>,
        @InjectRepository(IncomeCategory)
        private readonly categoryRepo: Repository<IncomeCategory>,
        private readonly cashRegisterService: CashRegisterService,
        private readonly customerAccountsService: CustomerAccountsService,
    ) { }

    /**
     * Crea un nuevo ingreso
     */
    async create(dto: CreateIncomeDto, userId?: string): Promise<Income> {
        // Validar que si es a cuenta corriente, tenga cliente
        if (dto.isOnAccount && !dto.customerId) {
            throw new BadRequestException(
                'Para ingresos a cuenta corriente debe seleccionar un cliente',
            );
        }

        // Validar que si NO es a cuenta corriente, tenga método de pago
        if (!dto.isOnAccount && !dto.paymentMethodId) {
            throw new BadRequestException(
                'Debe seleccionar un método de pago para ingresos que no son a cuenta corriente',
            );
        }

        // Si está pagado y no es a cuenta corriente, validar que haya caja abierta
        const isPaidIncome = !dto.isOnAccount && (dto.isPaid ?? true);
        if (isPaidIncome) {
            const openCashRegister = await this.cashRegisterService.getOpenRegister();
            if (!openCashRegister) {
                throw new BadRequestException(
                    'No hay caja abierta. Debe abrir la caja antes de registrar ingresos pagados.',
                );
            }
        }

        // Validar categoría si se especifica
        if (dto.categoryId) {
            const category = await this.categoryRepo.findOne({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException(
                    `Categoría con ID ${dto.categoryId} no encontrada`,
                );
            }
        }

        // Crear el ingreso
        const income = this.incomeRepo.create({
            description: dto.description,
            amount: dto.amount,
            incomeDate: parseLocalDate(dto.incomeDate),
            categoryId: dto.categoryId || null,
            customerId: dto.customerId || null,
            customerName: dto.customerName || null,
            isOnAccount: dto.isOnAccount || false,
            paymentMethodId: dto.isOnAccount ? null : dto.paymentMethodId,
            receiptNumber: dto.receiptNumber || null,
            isPaid: dto.isOnAccount ? false : (dto.isPaid ?? true),
            paidAt: (dto.isPaid ?? true) && !dto.isOnAccount ? new Date() : null,
            notes: dto.notes || null,
            createdById: userId || null,
        });

        const savedIncome = await this.incomeRepo.save(income);

        // Si es a cuenta corriente, registrar en cuenta del cliente
        if (dto.isOnAccount && dto.customerId) {
            await this.customerAccountsService.createCharge(
                dto.customerId,
                {
                    amount: dto.amount,
                    description: `Ingreso: ${dto.description}`,
                    saleId: savedIncome.id, // Usamos el campo saleId para referencia
                },
                userId,
            );
        }

        // Si está pagado y no es a cuenta corriente, registrar en caja
        if (savedIncome.isPaid && !savedIncome.isOnAccount && dto.paymentMethodId) {
            try {
                await this.cashRegisterService.registerServiceIncome(
                    { incomeId: savedIncome.id },
                    userId || 'system',
                );
            } catch (error) {
                // Si falla la caja, no bloqueamos la creación del ingreso
                console.warn('No se pudo registrar el ingreso en la caja:', error);
            }
        }

        // Retornar con relaciones cargadas
        return this.findOne(savedIncome.id);
    }

    /**
     * Obtiene ingresos con filtros y paginación
     */
    async findAll(filters: IncomeFiltersDto): Promise<PaginatedIncomes> {
        const {
            categoryId,
            customerId,
            search,
            startDate,
            endDate,
            isPaid,
            isOnAccount,
            page = 1,
            limit = 20,
            sortBy = 'incomeDate',
            order = 'DESC',
        } = filters;

        const query = this.incomeRepo
            .createQueryBuilder('income')
            .leftJoinAndSelect('income.category', 'category')
            .leftJoinAndSelect('income.customer', 'customer')
            .leftJoinAndSelect('income.paymentMethod', 'paymentMethod')
            .leftJoinAndSelect('income.createdBy', 'createdBy');

        // Filtros
        if (categoryId) {
            query.andWhere('income.categoryId = :categoryId', { categoryId });
        }

        if (customerId) {
            query.andWhere('income.customerId = :customerId', { customerId });
        }

        if (search) {
            query.andWhere('income.description ILIKE :search', {
                search: `%${search}%`,
            });
        }

        if (startDate) {
            query.andWhere('income.incomeDate >= :startDate', {
                startDate: parseLocalDate(startDate),
            });
        }

        if (endDate) {
            query.andWhere('income.incomeDate <= :endDate', {
                endDate: parseLocalDate(endDate),
            });
        }

        if (isPaid !== undefined) {
            query.andWhere('income.isPaid = :isPaid', { isPaid });
        }

        if (isOnAccount !== undefined) {
            query.andWhere('income.isOnAccount = :isOnAccount', { isOnAccount });
        }

        // Ordenamiento
        query.orderBy(`income.${sortBy}`, order);

        // Paginación
        const total = await query.getCount();
        const data = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Obtiene un ingreso por ID
     */
    async findOne(id: string): Promise<Income> {
        const income = await this.incomeRepo.findOne({
            where: { id },
            relations: ['category', 'customer', 'paymentMethod', 'createdBy'],
        });

        if (!income) {
            throw new NotFoundException(`Ingreso con ID ${id} no encontrado`);
        }

        return income;
    }

    /**
     * Actualiza un ingreso
     */
    async update(id: string, dto: UpdateIncomeDto): Promise<Income> {
        const income = await this.findOne(id);

        // No permitir cambiar isOnAccount si ya tiene movimientos
        if (dto.isOnAccount !== undefined && dto.isOnAccount !== income.isOnAccount) {
            throw new BadRequestException(
                'No se puede cambiar el tipo de cuenta de un ingreso ya registrado',
            );
        }

        // Validar categoría si se cambia
        if (dto.categoryId && dto.categoryId !== income.categoryId) {
            const category = await this.categoryRepo.findOne({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new NotFoundException(
                    `Categoría con ID ${dto.categoryId} no encontrada`,
                );
            }
        }

        // Actualizar campos
        if (dto.description !== undefined) income.description = dto.description;
        if (dto.amount !== undefined) income.amount = dto.amount;
        if (dto.incomeDate !== undefined) {
            income.incomeDate = parseLocalDate(dto.incomeDate);
        }
        if (dto.categoryId !== undefined) income.categoryId = dto.categoryId || null;
        if (dto.customerId !== undefined) income.customerId = dto.customerId || null;
        if (dto.customerName !== undefined) income.customerName = dto.customerName || null;
        if (dto.paymentMethodId !== undefined) {
            income.paymentMethodId = dto.paymentMethodId || null;
        }
        if (dto.receiptNumber !== undefined) income.receiptNumber = dto.receiptNumber || null;
        if (dto.notes !== undefined) income.notes = dto.notes || null;

        await this.incomeRepo.save(income);
        return this.findOne(id);
    }

    /**
     * Elimina un ingreso (soft delete)
     */
    async remove(id: string): Promise<{ message: string }> {
        await this.findOne(id);
        await this.incomeRepo.softDelete(id);
        return { message: 'Ingreso eliminado correctamente' };
    }

    /**
     * Marca un ingreso pendiente como cobrado y registra en caja
     */
    async markAsPaid(
        id: string,
        userId: string,
        paymentMethodId: string,
    ): Promise<Income> {
        const income = await this.findOne(id);

        if (income.isPaid) {
            throw new BadRequestException('Este ingreso ya está marcado como cobrado');
        }

        if (income.isOnAccount) {
            throw new BadRequestException(
                'Los ingresos a cuenta corriente no se marcan como cobrados desde aquí',
            );
        }

        // Marcar como pagado
        income.isPaid = true;
        income.paidAt = new Date();
        income.paymentMethodId = paymentMethodId;

        await this.incomeRepo.save(income);

        // Registrar en caja
        try {
            await this.cashRegisterService.registerServiceIncome(
                { incomeId: income.id },
                userId,
            );
        } catch (error) {
            console.warn('No se pudo registrar el ingreso en la caja:', error);
        }

        return this.findOne(id);
    }

    /**
     * Obtiene estadísticas de ingresos
     */
    async getStats(startDate?: string, endDate?: string): Promise<IncomeStats> {
        const query = this.incomeRepo.createQueryBuilder('income');

        if (startDate) {
            query.andWhere('income.incomeDate >= :startDate', {
                startDate: parseLocalDate(startDate),
            });
        }

        if (endDate) {
            query.andWhere('income.incomeDate <= :endDate', {
                endDate: parseLocalDate(endDate),
            });
        }

        // Total general
        const totals = await query
            .select([
                'COUNT(income.id) as "totalIncomes"',
                'COALESCE(SUM(income.amount), 0) as "totalAmount"',
                'COALESCE(SUM(CASE WHEN income.isPaid = false THEN income.amount ELSE 0 END), 0) as "totalPending"',
            ])
            .getRawOne();

        // Por categoría
        const byCategoryQuery = this.incomeRepo
            .createQueryBuilder('income')
            .leftJoin('income.category', 'category')
            .select([
                'income.categoryId as "categoryId"',
                'COALESCE(category.name, \'Sin categoría\') as "categoryName"',
                'COUNT(income.id) as count',
                'COALESCE(SUM(income.amount), 0) as total',
            ])
            .groupBy('income.categoryId')
            .addGroupBy('category.name');

        if (startDate) {
            byCategoryQuery.andWhere('income.incomeDate >= :startDate', {
                startDate: parseLocalDate(startDate),
            });
        }

        if (endDate) {
            byCategoryQuery.andWhere('income.incomeDate <= :endDate', {
                endDate: parseLocalDate(endDate),
            });
        }

        const byCategory = await byCategoryQuery.getRawMany();

        return {
            totalIncomes: parseInt(totals.totalIncomes) || 0,
            totalAmount: parseFloat(totals.totalAmount) || 0,
            totalPending: parseFloat(totals.totalPending) || 0,
            byCategory: byCategory.map((cat) => ({
                categoryId: cat.categoryId || 'none',
                categoryName: cat.categoryName,
                count: parseInt(cat.count) || 0,
                total: parseFloat(cat.total) || 0,
            })),
        };
    }
}
