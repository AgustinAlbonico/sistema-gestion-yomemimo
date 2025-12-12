import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { CashRegister, CashRegisterStatus } from './entities/cash-register.entity';
import { CashMovement, MovementType } from './entities/cash-movement.entity';
import { CashRegisterTotals } from './entities/cash-register-totals.entity';
import { PaymentMethod as PaymentMethodEntity } from '../configuration/entities/payment-method.entity';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { CashFlowReportFiltersDto } from './dto/cash-flow-report-filters.dto';
import { getTodayLocalDate } from '../../common/utils/date.utils';

@Injectable()
export class CashRegisterService {
    constructor(
        @InjectRepository(CashRegister)
        private readonly cashRegisterRepo: Repository<CashRegister>,
        @InjectRepository(CashMovement)
        private readonly cashMovementRepo: Repository<CashMovement>,
        @InjectRepository(CashRegisterTotals)
        private readonly cashTotalsRepo: Repository<CashRegisterTotals>,
        @InjectRepository(PaymentMethodEntity)
        private readonly paymentMethodRepo: Repository<PaymentMethodEntity>,
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    // ============ SPRINT 1: Saldo Sugerido ============

    /**
     * Obtener saldo inicial sugerido (del día anterior)
     */
    async getSuggestedInitialAmount(): Promise<{
        suggested: number;
        previousDate: Date | null;
        previousActual: number;
    }> {
        const previousRegister = await this.getPreviousDayCashRegister();

        return {
            suggested: previousRegister?.actualAmount ? Number(previousRegister.actualAmount) : 0,
            previousDate: previousRegister?.date || null,
            previousActual: previousRegister?.actualAmount ? Number(previousRegister.actualAmount) : 0,
        };
    }

    /**
     * Obtener caja del día anterior para continuidad
     */
    private async getPreviousDayCashRegister(): Promise<CashRegister | null> {
        return this.cashRegisterRepo.findOne({
            where: { status: CashRegisterStatus.CLOSED },
            order: { closedAt: 'DESC' },
        });
    }

    /**
     * Abrir una nueva caja
     */
    async open(dto: OpenCashRegisterDto, userId: string): Promise<CashRegister> {
        // Verificar que no hay caja abierta
        const openRegister = await this.getOpenRegister();
        if (openRegister) {
            throw new BadRequestException('Ya existe una caja abierta');
        }

        // Verificar que no exista una caja del día de hoy (abierta o cerrada)
        const todayDate = getTodayLocalDate();
        const existingTodaysRegister = await this.cashRegisterRepo.findOne({
            where: { date: todayDate },
        });

        if (existingTodaysRegister) {
            if (existingTodaysRegister.status === CashRegisterStatus.CLOSED) {
                throw new BadRequestException(
                    'Ya existe una caja cerrada para el día de hoy. Debe reabrirla para continuar operando.'
                );
            } else {
                throw new BadRequestException('Ya existe una caja para el día de hoy');
            }
        }

        // Obtener saldo final del día anterior para validación
        const previousRegister = await this.getPreviousDayCashRegister();
        const suggestedInitialAmount = previousRegister?.actualAmount
            ? Number(previousRegister.actualAmount)
            : 0;

        // Validar si se ajustó manualmente
        if (dto.manuallyAdjusted && dto.initialAmount !== suggestedInitialAmount) {
            console.warn(
                `[CashRegister] Saldo inicial ajustado manualmente. ` +
                `Sugerido: ${suggestedInitialAmount}, Ingresado: ${dto.initialAmount}. ` +
                `Razón: ${dto.adjustmentReason || 'No especificada'}`,
            );
        }

        const cashRegister = this.cashRegisterRepo.create({
            date: todayDate,
            openedAt: new Date(),
            initialAmount: dto.initialAmount,
            totalIncome: 0,
            totalExpense: 0,
            openingNotes: dto.openingNotes,
            status: CashRegisterStatus.OPEN,
            openedBy: { id: userId } as any,
        });

        const saved = await this.cashRegisterRepo.save(cashRegister);

        // Crear totales iniciales por método de pago
        await this.initializePaymentMethodTotals(saved, dto.initialAmount);

        // Recargar con relaciones
        return this.cashRegisterRepo.findOne({
            where: { id: saved.id },
            relations: ['movements', 'openedBy', 'totals'],
        }) as Promise<CashRegister>;
    }

    /**
     * Inicializar totales por método de pago
     */
    private async initializePaymentMethodTotals(
        cashRegister: CashRegister,
        initialCashAmount: number,
    ): Promise<void> {
        const paymentMethods = await this.paymentMethodRepo.find({ where: { isActive: true } });

        for (const method of paymentMethods) {
            const initialAmount = method.code === 'cash' ? initialCashAmount : 0;
            await this.cashTotalsRepo.save({
                cashRegister,
                paymentMethod: method,
                paymentMethodId: method.id,
                initialAmount,
                totalIncome: 0,
                totalExpense: 0,
                expectedAmount: initialAmount,
            });
        }
    }

    /**
     * Cerrar la caja abierta con arqueo detallado
     */
    async close(dto: CloseCashRegisterDto, userId: string): Promise<CashRegister> {
        const cashRegister = await this.cashRegisterRepo.findOne({
            where: { status: CashRegisterStatus.OPEN },
            relations: ['totals'],
        });

        if (!cashRegister) {
            throw new NotFoundException('No hay caja abierta');
        }

        // Actualizar montos reales por método de pago
        await this.updateActualAmounts(cashRegister, dto);

        // Recalcular totales esperados
        const totals = await this.cashTotalsRepo.find({
            where: { cashRegister: { id: cashRegister.id } },
        });

        // Calcular totales generales
        const expectedAmount =
            Number(cashRegister.initialAmount) +
            Number(cashRegister.totalIncome) -
            Number(cashRegister.totalExpense);

        const totalActual = this.calculateTotalActual(totals);
        const difference = totalActual - expectedAmount;

        cashRegister.closedAt = new Date();
        cashRegister.expectedAmount = expectedAmount;
        cashRegister.actualAmount = totalActual;
        cashRegister.difference = difference;
        cashRegister.closingNotes = dto.closingNotes;
        cashRegister.status = CashRegisterStatus.CLOSED;
        cashRegister.closedBy = { id: userId } as any;

        await this.cashRegisterRepo.save(cashRegister);

        // Recargar con todas las relaciones
        return this.cashRegisterRepo.findOne({
            where: { id: cashRegister.id },
            relations: ['movements', 'openedBy', 'closedBy', 'totals'],
        }) as Promise<CashRegister>;
    }

    /**
     * Reabrir una caja cerrada del día actual
     */
    async reopen(cashRegisterId: string, userId: string): Promise<CashRegister> {
        const cashRegister = await this.cashRegisterRepo.findOne({
            where: { id: cashRegisterId },
            relations: ['movements', 'openedBy', 'totals'],
        });

        if (!cashRegister) {
            throw new NotFoundException('Caja no encontrada');
        }

        // Validar que la caja esté cerrada
        if (cashRegister.status === CashRegisterStatus.OPEN) {
            throw new BadRequestException('La caja ya está abierta');
        }

        // Validar que la caja sea del día actual
        if (!this.isSameDayAsToday(cashRegister.date)) {
            throw new BadRequestException(
                'Solo se puede reabrir la caja del día actual'
            );
        }

        // Verificar que no haya otra caja abierta
        const openRegister = await this.getOpenRegister();
        if (openRegister) {
            throw new BadRequestException('Ya existe otra caja abierta');
        }

        // Limpiar datos de cierre y reabrir
        cashRegister.status = CashRegisterStatus.OPEN;
        cashRegister.closedAt = undefined;
        cashRegister.closedBy = undefined;
        cashRegister.expectedAmount = undefined;
        cashRegister.actualAmount = undefined;
        cashRegister.difference = undefined;
        cashRegister.closingNotes = undefined;

        // Limpiar montos reales y diferencias de los totales
        for (const total of cashRegister.totals) {
            total.actualAmount = undefined;
            total.difference = undefined;
            await this.cashTotalsRepo.save(total);
        }

        await this.cashRegisterRepo.save(cashRegister);

        console.log(`[CashRegister] Caja ${cashRegisterId} reabierta por usuario ${userId}`);

        // Recargar con todas las relaciones
        return this.cashRegisterRepo.findOne({
            where: { id: cashRegisterId },
            relations: ['movements', 'movements.createdBy', 'openedBy', 'totals'],
            order: {
                movements: {
                    createdAt: 'DESC',
                },
            },
        }) as Promise<CashRegister>;
    }

    /**
     * Actualizar montos reales por método de pago
     */
    private async updateActualAmounts(
        cashRegister: CashRegister,
        dto: CloseCashRegisterDto,
    ): Promise<void> {
        const totals = await this.cashTotalsRepo.find({
            where: { cashRegister: { id: cashRegister.id } },
            relations: ['paymentMethod'],
        });

        // Efectivo
        const cashTotal = totals.find(t => t.paymentMethod.code === 'cash');
        if (cashTotal) {
            cashTotal.actualAmount = dto.actualCashAmount;
            cashTotal.difference = dto.actualCashAmount - Number(cashTotal.expectedAmount);
            await this.cashTotalsRepo.save(cashTotal);
        }

        // Otros métodos (si se proporcionan)
        if (dto.actualAmounts) {
            for (const [code, amount] of Object.entries(dto.actualAmounts)) {
                if (amount !== undefined && amount !== null) {
                    const total = totals.find(t => t.paymentMethod.code === code);
                    if (total) {
                        total.actualAmount = amount;
                        total.difference = amount - Number(total.expectedAmount);
                        await this.cashTotalsRepo.save(total);
                    }
                }
            }
        }

        // Para métodos no especificados, usar el valor esperado como actual
        for (const total of totals) {
            if (total.actualAmount === null || total.actualAmount === undefined) {
                total.actualAmount = Number(total.expectedAmount);
                total.difference = 0;
                await this.cashTotalsRepo.save(total);
            }
        }
    }

    /**
     * Calcular total actual sumando todos los métodos
     */
    private calculateTotalActual(totals: CashRegisterTotals[]): number {
        return totals.reduce(
            (sum, t) => sum + Number(t.actualAmount ?? t.expectedAmount ?? 0),
            0,
        );
    }

    /**
     * Verifica si una fecha corresponde al día actual
     * Compara strings de fecha para evitar problemas de zona horaria
     */
    private isSameDayAsToday(date: Date | string): boolean {
        const todayDate = getTodayLocalDate();
        const todayString = todayDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // La fecha puede ser un Date o un string, normalizarla
        const dateString = date instanceof Date
            ? date.toISOString().split('T')[0]
            : String(date).split('T')[0];

        return dateString === todayString;
    }

    /**
     * Obtener la caja abierta actual
     */
    async getOpenRegister(): Promise<CashRegister | null> {
        const register = await this.cashRegisterRepo.findOne({
            where: { status: CashRegisterStatus.OPEN },
            relations: ['openedBy', 'totals', 'totals.paymentMethod'],
        });

        if (register) {
            register.movements = await this.loadMovementsWithDetails(register.id);
        }

        return register;
    }

    /**
     * Cargar movimientos con detalles de ventas, gastos y compras
     */
    private async loadMovementsWithDetails(registerId: string): Promise<any[]> {
        const movements = await this.cashMovementRepo
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.createdBy', 'createdBy')
            .leftJoinAndSelect('movement.cashRegister', 'cashRegister')
            // Join con SalePayment para ingresos de ventas
            .leftJoin('sale_payments', 'sp', 'movement.referenceType = :saleType AND movement.referenceId = sp.id', { saleType: 'sale_payment' })
            .leftJoin('sales', 's', 'sp.sale_id = s.id')
            .leftJoin('payment_methods', 'pm_sale', 'sp.payment_method_id = pm_sale.id')
            // Join con Expense para egresos de gastos
            .leftJoin('expenses', 'e', 'movement.referenceType = :expenseType AND movement.referenceId = e.id', { expenseType: 'expense' })
            .leftJoin('payment_methods', 'pm_expense', 'e.payment_method_id = pm_expense.id')
            // Join con Purchase para egresos de compras
            .leftJoin('purchases', 'p', 'movement.referenceType = :purchaseType AND movement.referenceId = p.id', { purchaseType: 'purchase' })
            .leftJoin('payment_methods', 'pm_purchase', 'p.payment_method_id = pm_purchase.id')
            .select([
                'movement.id',
                'movement.movementType',
                'movement.referenceType',
                'movement.referenceId',
                'movement.createdAt',
                'createdBy.id',
                'createdBy.firstName',
                'createdBy.lastName',
            ])
            // Mapear campos dinámicos - prioridad: sale_payment > expense > purchase
            .addSelect('COALESCE(sp.amount, e.amount, p.total)', 'amount')
            .addSelect(`CASE 
                WHEN s.id IS NOT NULL THEN CONCAT('Venta ', s."saleNumber") 
                WHEN e.id IS NOT NULL THEN e.description 
                WHEN p.id IS NOT NULL THEN CONCAT('Compra ', p."purchaseNumber")
                ELSE 'Movimiento' 
            END`, 'description')
            .addSelect('COALESCE(pm_sale.name, pm_expense.name, pm_purchase.name)', 'paymentMethodName')
            .addSelect('COALESCE(pm_sale.code, pm_expense.code, pm_purchase.code)', 'paymentMethodCode')
            .where('movement.cashRegister.id = :registerId', { registerId })
            .orderBy('movement.createdAt', 'DESC')
            .getRawMany();

        return this.mapRawMovements(movements);
    }

    /**
     * Mapear resultados raw a objetos que el frontend pueda entender
     * getRawMany() devuelve campos con prefijos como movement_id, movement_createdAt, etc.
     */
    private mapRawMovements(movements: any[]): any[] {
        return movements.map(m => ({
            id: m.movement_id,
            movementType: m.movement_movementType,
            referenceType: m.movement_referenceType,
            referenceId: m.movement_referenceId,
            createdAt: m.movement_createdAt,
            createdBy: {
                id: m.createdBy_id,
                firstName: m.createdBy_firstName,
                lastName: m.createdBy_lastName
            },
            // Campos calculados desde los JOINs
            amount: Number(m.amount),
            description: m.description,
            paymentMethod: {
                name: m.paymentMethodName,
                code: m.paymentMethodCode
            }
        }));
    }

    /**
     * Registrar ingreso desde venta
     */
    async registerIncome(
        data: {
            salePaymentId: string;
        },
        userId: string,
    ): Promise<CashMovement> {
        const cashRegister = await this.getOpenRegister();

        if (!cashRegister) {
            throw new BadRequestException('No hay caja abierta');
        }

        // Obtener el pago de venta para actualizar totales
        const salePayment = await this.dataSource.query(
            `SELECT sp.*, pm.id as "paymentMethodId", pm.code as "paymentMethodCode" 
             FROM sale_payments sp
             JOIN payment_methods pm ON sp.payment_method_id = pm.id
             WHERE sp.id = $1`,
            [data.salePaymentId]
        );

        if (!salePayment || salePayment.length === 0) {
            throw new NotFoundException('Pago de venta no encontrado');
        }

        const payment = salePayment[0];
        const amount = Number(payment.amount);

        const isValidUUID = userId && userId !== 'system' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        // Usar query directo para evitar problemas con cascade de TypeORM
        const result = await this.dataSource.query(
            `INSERT INTO cash_movements 
                (cash_register_id, "movementType", "referenceType", "referenceId", created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                cashRegister.id,
                MovementType.INCOME,
                'sale_payment',
                data.salePaymentId,
                isValidUUID ? userId : null
            ]
        );

        const savedMovement = result[0];

        // Actualizar totales de caja usando UPDATE directo para no tocar relaciones
        await this.cashRegisterRepo.update(
            { id: cashRegister.id },
            { totalIncome: Number(cashRegister.totalIncome) + Math.abs(amount) }
        );

        // Actualizar totales por método de pago
        // Necesitamos la entidad PaymentMethod para updatePaymentMethodTotal
        const paymentMethodEntity = await this.paymentMethodRepo.findOneBy({ id: payment.paymentMethodId });

        if (paymentMethodEntity) {
            await this.updatePaymentMethodTotal(
                cashRegister.id,
                paymentMethodEntity,
                Math.abs(amount),
                'income',
            );
        }

        return savedMovement;
    }

    /**
     * Registrar egreso desde gasto
     */
    async registerExpense(
        data: {
            expenseId: string;
        },
        userId: string,
    ): Promise<CashMovement> {
        const cashRegister = await this.getOpenRegister();

        if (!cashRegister) {
            throw new BadRequestException('No hay caja abierta');
        }

        // Obtener el gasto para actualizar totales
        const expenseResult = await this.dataSource.query(
            `SELECT e.*, pm.id as "paymentMethodId", pm.code as "paymentMethodCode" 
             FROM expenses e
             JOIN payment_methods pm ON e.payment_method_id = pm.id
             WHERE e.id = $1`,
            [data.expenseId]
        );

        if (!expenseResult || expenseResult.length === 0) {
            throw new NotFoundException('Gasto no encontrado');
        }

        const expense = expenseResult[0];
        const amount = Number(expense.amount);

        const isValidUUID = userId && userId !== 'system' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        // Usar query directo para evitar problemas con cascade de TypeORM
        const result = await this.dataSource.query(
            `INSERT INTO cash_movements 
                (cash_register_id, "movementType", "referenceType", "referenceId", created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                cashRegister.id,
                MovementType.EXPENSE,
                'expense',
                data.expenseId,
                isValidUUID ? userId : null
            ]
        );

        const savedMovement = result[0];

        // Actualizar totales de caja usando UPDATE directo para no tocar relaciones
        await this.cashRegisterRepo.update(
            { id: cashRegister.id },
            { totalExpense: Number(cashRegister.totalExpense) + Math.abs(amount) }
        );

        // Actualizar totales por método de pago
        const paymentMethodEntity = await this.paymentMethodRepo.findOneBy({ id: expense.paymentMethodId });

        if (paymentMethodEntity) {
            await this.updatePaymentMethodTotal(
                cashRegister.id,
                paymentMethodEntity,
                Math.abs(amount),
                'expense',
            );
        }

        return savedMovement;
    }

    /**
     * Registrar ingreso desde servicio (módulo de ingresos)
     */
    async registerServiceIncome(
        data: {
            incomeId: string;
        },
        userId: string,
    ): Promise<CashMovement> {
        const cashRegister = await this.getOpenRegister();

        if (!cashRegister) {
            throw new BadRequestException('No hay caja abierta');
        }

        // Obtener el ingreso para actualizar totales
        const incomeResult = await this.dataSource.query(
            `SELECT i.*, pm.id as "paymentMethodId", pm.code as "paymentMethodCode" 
             FROM incomes i
             JOIN payment_methods pm ON i.payment_method_id = pm.id
             WHERE i.id = $1`,
            [data.incomeId]
        );

        if (!incomeResult || incomeResult.length === 0) {
            throw new NotFoundException('Ingreso no encontrado');
        }

        const income = incomeResult[0];
        const amount = Number(income.amount);

        const isValidUUID = userId && userId !== 'system' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        // Usar query directo para evitar problemas con cascade de TypeORM
        const result = await this.dataSource.query(
            `INSERT INTO cash_movements 
                (cash_register_id, "movementType", "referenceType", "referenceId", created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                cashRegister.id,
                MovementType.INCOME,
                'income',
                data.incomeId,
                isValidUUID ? userId : null
            ]
        );

        const savedMovement = result[0];

        // Actualizar totales de caja usando UPDATE directo para no tocar relaciones
        await this.cashRegisterRepo.update(
            { id: cashRegister.id },
            { totalIncome: Number(cashRegister.totalIncome) + Math.abs(amount) }
        );

        // Actualizar totales por método de pago
        const paymentMethodEntity = await this.paymentMethodRepo.findOneBy({ id: income.paymentMethodId });

        if (paymentMethodEntity) {
            await this.updatePaymentMethodTotal(
                cashRegister.id,
                paymentMethodEntity,
                Math.abs(amount),
                'income',
            );
        }

        return savedMovement;
    }

    /**
     * Registrar egreso desde compra
     */
    async registerPurchase(
        data: {
            purchaseId: string;
            total?: number;
            paymentMethodId?: string;
        },
        userId: string,
    ): Promise<CashMovement> {
        const cashRegister = await this.getOpenRegister();

        if (!cashRegister) {
            throw new BadRequestException('No hay caja abierta');
        }

        let amount: number;
        let paymentMethodId: string | undefined = data.paymentMethodId;

        // Si se pasan los datos directamente, usarlos (para evitar problemas con transacciones)
        if (data.total !== undefined && data.paymentMethodId !== undefined) {
            amount = Number(data.total);
        } else {
            // Fallback: obtener la compra de la base de datos
            const purchaseResult = await this.dataSource.query(
                `SELECT p.*, pm.id as "paymentMethodId", pm.code as "paymentMethodCode" 
                 FROM purchases p
                 LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
                 WHERE p.id = $1`,
                [data.purchaseId]
            );

            if (!purchaseResult || purchaseResult.length === 0) {
                throw new NotFoundException('Compra no encontrada');
            }

            const purchase = purchaseResult[0];
            amount = Number(purchase.total);
            paymentMethodId = purchase.paymentMethodId;
        }

        const isValidUUID = userId && userId !== 'system' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        // Usar query directo para evitar problemas con cascade de TypeORM
        const result = await this.dataSource.query(
            `INSERT INTO cash_movements 
                (cash_register_id, "movementType", "referenceType", "referenceId", created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                cashRegister.id,
                MovementType.EXPENSE,
                'purchase',
                data.purchaseId,
                isValidUUID ? userId : null
            ]
        );

        const savedMovement = result[0];

        // Actualizar totales de caja usando UPDATE directo para no tocar relaciones
        await this.cashRegisterRepo.update(
            { id: cashRegister.id },
            { totalExpense: Number(cashRegister.totalExpense) + Math.abs(amount) }
        );

        // Actualizar totales por método de pago
        if (paymentMethodId) {
            const paymentMethodEntity = await this.paymentMethodRepo.findOneBy({ id: paymentMethodId });

            if (paymentMethodEntity) {
                await this.updatePaymentMethodTotal(
                    cashRegister.id,
                    paymentMethodEntity,
                    Math.abs(amount),
                    'expense',
                );
            }
        }

        return savedMovement;
    }

    /**
     * Actualizar totales por método de pago
     */
    private async updatePaymentMethodTotal(
        cashRegisterId: string,
        paymentMethod: PaymentMethodEntity,
        amount: number,
        type: 'income' | 'expense',
    ): Promise<void> {
        let total = await this.cashTotalsRepo.findOne({
            where: {
                cashRegister: { id: cashRegisterId },
                paymentMethod: { id: paymentMethod.id },
            },
        });

        // Si no existe el total para este método de pago, crearlo
        if (!total) {
            console.log(`[CashRegister] Creando total para método ${paymentMethod.name} en caja ${cashRegisterId}`);
            total = this.cashTotalsRepo.create({
                cashRegister: { id: cashRegisterId } as any,
                paymentMethod,
                initialAmount: 0,
                totalIncome: 0,
                totalExpense: 0,
                expectedAmount: 0,
            });
        }

        if (type === 'income') {
            total.totalIncome = Number(total.totalIncome) + amount;
        } else {
            total.totalExpense = Number(total.totalExpense) + amount;
        }
        total.expectedAmount =
            Number(total.initialAmount) +
            Number(total.totalIncome) -
            Number(total.totalExpense);
        await this.cashTotalsRepo.save(total);
    }

    /**
     * Crear movimiento manual
     */
    // ============ SPRINT 1: REPORTES POR RANGO DE FECHAS ============

    /**
     * Obtener reporte de flujo de caja
     */
    async getCashFlowReport(filters: CashFlowReportFiltersDto) {
        const { startDate, endDate, paymentMethod, includeComparison } = filters;

        // Obtener registros del período principal
        const query = this.cashRegisterRepo
            .createQueryBuilder('register')
            .leftJoinAndSelect('register.totals', 'totals')
            .leftJoinAndSelect('totals.paymentMethod', 'paymentMethod')
            .leftJoinAndSelect('register.movements', 'movements')
            .where('register.date BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .orderBy('register.date', 'ASC');

        const registers = await query.getMany();

        // Filtrar totales por método de pago si se especifica
        if (paymentMethod) {
            registers.forEach(r => {
                r.totals = r.totals?.filter(t => t.paymentMethod.code === paymentMethod) || [];
            });
        }

        // Calcular período anterior para comparación
        let comparison = null;
        if (includeComparison) {
            comparison = await this.calculateComparisonPeriod(startDate, endDate);
        }

        return {
            period: { start: startDate, end: endDate },
            summary: this.calculateSummary(registers),
            byPaymentMethod: this.calculateByPaymentMethod(registers),
            dailyBreakdown: this.calculateDailyBreakdown(registers),
            comparison,
        };
    }

    /**
     * Calcular resumen del período
     */
    private calculateSummary(registers: CashRegister[]) {
        const closedRegisters = registers.filter(
            r => r.status === CashRegisterStatus.CLOSED,
        );

        const totalIncome = closedRegisters.reduce(
            (sum, r) => sum + Number(r.totalIncome),
            0,
        );
        const totalExpense = closedRegisters.reduce(
            (sum, r) => sum + Number(r.totalExpense),
            0,
        );

        return {
            totalDays: registers.length,
            closedDays: closedRegisters.length,
            totalIncome,
            totalExpense,
            netCashFlow: totalIncome - totalExpense,
            totalDifferences: closedRegisters.reduce(
                (sum, r) => sum + Number(r.difference || 0),
                0,
            ),
            averageDailyIncome:
                closedRegisters.length > 0
                    ? totalIncome / closedRegisters.length
                    : 0,
        };
    }

    /**
     * Calcular totales por método de pago
     */
    private calculateByPaymentMethod(registers: CashRegister[]) {
        const methodTotals: Record<
            string,
            {
                totalIncome: number;
                totalExpense: number;
                netAmount: number;
                totalDifferences: number;
            }
        > = {};

        registers.forEach(register => {
            register.totals?.forEach(total => {
                const key = total.paymentMethod.name;
                if (!methodTotals[key]) {
                    methodTotals[key] = {
                        totalIncome: 0,
                        totalExpense: 0,
                        netAmount: 0,
                        totalDifferences: 0,
                    };
                }

                methodTotals[key].totalIncome += Number(total.totalIncome);
                methodTotals[key].totalExpense += Number(total.totalExpense);
                methodTotals[key].netAmount +=
                    Number(total.totalIncome) - Number(total.totalExpense);
                methodTotals[key].totalDifferences += Number(
                    total.difference || 0,
                );
            });
        });

        return methodTotals;
    }

    /**
     * Calcular desglose diario
     */
    private calculateDailyBreakdown(registers: CashRegister[]) {
        return registers.map(register => ({
            date: register.date,
            status: register.status,
            income: Number(register.totalIncome),
            expense: Number(register.totalExpense),
            net: Number(register.totalIncome) - Number(register.totalExpense),
            difference: Number(register.difference || 0),
            movementsCount: register.movements?.length || 0,
        }));
    }

    /**
     * Calcular comparación con período anterior
     */
    private async calculateComparisonPeriod(startDate: string, endDate: string) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.floor(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );

        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - days);

        const prevRegisters = await this.cashRegisterRepo.find({
            where: {
                date: Between(prevStart, prevEnd),
            },
            relations: ['totals'],
        });

        const summary = this.calculateSummary(prevRegisters);

        return {
            period: {
                start: prevStart.toISOString().split('T')[0],
                end: prevEnd.toISOString().split('T')[0],
            },
            summary,
        };
    }

    // ============ HISTORIAL Y ESTADÍSTICAS ============

    /**
     * Obtener historial de cajas
     */
    async findAll(startDate?: Date, endDate?: Date): Promise<CashRegister[]> {
        const query = this.cashRegisterRepo
            .createQueryBuilder('register')
            .leftJoinAndSelect('register.movements', 'movements')
            .leftJoinAndSelect('register.openedBy', 'openedBy')
            .leftJoinAndSelect('register.closedBy', 'closedBy')
            .leftJoinAndSelect('register.totals', 'totals')
            .orderBy('register.date', 'DESC');

        if (startDate && endDate) {
            query.where('register.date BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            });
        }

        return query.getMany();
    }

    /**
     * Obtener estadísticas de cajas
     */
    async getStats(startDate?: Date, endDate?: Date) {
        const registers = await this.findAll(startDate, endDate);

        const closedRegisters = registers.filter(
            (r) => r.status === CashRegisterStatus.CLOSED,
        );

        const totalIncome = closedRegisters.reduce(
            (sum, r) => sum + Number(r.totalIncome),
            0,
        );
        const totalExpense = closedRegisters.reduce(
            (sum, r) => sum + Number(r.totalExpense),
            0,
        );
        const totalDifferences = closedRegisters.reduce(
            (sum, r) => sum + Number(r.difference || 0),
            0,
        );

        return {
            totalRegisters: registers.length,
            closedRegisters: closedRegisters.length,
            openRegisters: registers.filter((r) => r.status === CashRegisterStatus.OPEN)
                .length,
            totalIncome,
            totalExpense,
            netCashFlow: totalIncome - totalExpense,
            totalDifferences,
            averageDifference:
                closedRegisters.length > 0 ? totalDifferences / closedRegisters.length : 0,
        };
    }

    /**
     * Obtener una caja por ID
     */
    async findOne(id: string): Promise<CashRegister> {
        const cashRegister = await this.cashRegisterRepo.findOne({
            where: { id },
            relations: ['openedBy', 'closedBy', 'totals', 'totals.paymentMethod'],
        });

        if (!cashRegister) {
            throw new NotFoundException('Caja no encontrada');
        }

        // Cargar movimientos con JOINs para obtener datos calculados
        const movements = await this.cashMovementRepo
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.createdBy', 'createdBy')
            .leftJoinAndSelect('movement.cashRegister', 'cashRegister')
            // Join con SalePayment para ingresos de ventas
            .leftJoin('sale_payments', 'sp', 'movement.referenceType = :saleType AND movement.referenceId = sp.id', { saleType: 'sale_payment' })
            .leftJoin('sales', 's', 'sp.sale_id = s.id')
            .leftJoin('payment_methods', 'pm_sale', 'sp.payment_method_id = pm_sale.id')
            // Join con Expense para egresos de gastos
            .leftJoin('expenses', 'e', 'movement.referenceType = :expenseType AND movement.referenceId = e.id', { expenseType: 'expense' })
            .leftJoin('payment_methods', 'pm_expense', 'e.payment_method_id = pm_expense.id')
            // Join con Purchase para egresos de compras
            .leftJoin('purchases', 'p', 'movement.referenceType = :purchaseType AND movement.referenceId = p.id', { purchaseType: 'purchase' })
            .leftJoin('payment_methods', 'pm_purchase', 'p.payment_method_id = pm_purchase.id')
            .select([
                'movement.id',
                'movement.movementType',
                'movement.referenceType',
                'movement.referenceId',
                'movement.createdAt',
                'createdBy.id',
                'createdBy.firstName',
                'createdBy.lastName',
            ])
            // Mapear campos dinámicos - prioridad: sale_payment > expense > purchase
            .addSelect('COALESCE(sp.amount, e.amount, p.total)', 'amount')
            .addSelect(`CASE 
                WHEN s.id IS NOT NULL THEN CONCAT('Venta ', s."saleNumber") 
                WHEN e.id IS NOT NULL THEN e.description 
                WHEN p.id IS NOT NULL THEN CONCAT('Compra ', p."purchaseNumber")
                ELSE 'Movimiento' 
            END`, 'description')
            .addSelect('COALESCE(pm_sale.name, pm_expense.name, pm_purchase.name)', 'paymentMethodName')
            .addSelect('COALESCE(pm_sale.code, pm_expense.code, pm_purchase.code)', 'paymentMethodCode')
            .where('movement.cashRegister.id = :registerId', { registerId: cashRegister.id })
            .orderBy('movement.createdAt', 'DESC')
            .getRawMany();

        // Mapear resultados raw a objetos que el frontend pueda entender
        cashRegister.movements = movements.map(m => ({
            id: m.movement_id,
            movementType: m.movement_movementType,
            referenceType: m.movement_referenceType,
            referenceId: m.movement_referenceId,
            createdAt: m.movement_createdAt,
            createdBy: {
                id: m.createdBy_id,
                firstName: m.createdBy_firstName,
                lastName: m.createdBy_lastName
            },
            // Campos calculados desde los JOINs
            amount: Number(m.amount),
            description: m.description,
            paymentMethod: {
                name: m.paymentMethodName,
                code: m.paymentMethodCode
            }
        })) as any;

        return cashRegister;
    }

    /**
     * Obtener estado de la caja (si está abierta y si es del día anterior)
     * Útil para mostrar alertas cuando la caja no fue cerrada el día anterior
     */
    async getCashStatus(): Promise<{
        hasOpenRegister: boolean;
        isFromPreviousDay: boolean;
        openRegister: CashRegister | null;
    }> {
        const openRegister = await this.getOpenRegister();

        if (!openRegister) {
            return { hasOpenRegister: false, isFromPreviousDay: false, openRegister: null };
        }

        const todayDate = getTodayLocalDate();
        const todayString = todayDate.toISOString().split('T')[0];

        // Normalizar la fecha de la caja a string YYYY-MM-DD
        let cashRegisterDateString: string;
        if (openRegister.date instanceof Date) {
            cashRegisterDateString = openRegister.date.toISOString().split('T')[0];
        } else {
            cashRegisterDateString = String(openRegister.date).split('T')[0];
        }

        return {
            hasOpenRegister: true,
            isFromPreviousDay: cashRegisterDateString !== todayString,
            openRegister,
        };
    }
}

