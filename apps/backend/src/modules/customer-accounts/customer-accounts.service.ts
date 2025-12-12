/**
 * Servicio de Cuentas Corrientes
 * Gestiona el CRUD de cuentas y movimientos de clientes
 */
import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CustomerAccount, AccountStatus } from './entities/customer-account.entity';
import { AccountMovement, MovementType } from './entities/account-movement.entity';
import { CreateChargeDto, CreatePaymentDto, UpdateAccountDto, AccountFiltersDto } from './dto';
import { CustomersService } from '../customers/customers.service';

/**
 * Interfaz para estadísticas de cuentas corrientes
 */
interface AccountStats {
    totalAccounts: number;
    activeAccounts: number;
    suspendedAccounts: number;
    totalDebtors: number;
    totalDebt: number;
    averageDebt: number;
    overdueAccounts: number;
    totalOverdue: number;
}

/**
 * Interfaz para resumen de estado de cuenta
 */
interface AccountStatementSummary {
    totalCharges: number;
    totalPayments: number;
    currentBalance: number;
    customerPosition: 'customer_owes' | 'business_owes' | 'settled';
}

/**
 * Interfaz para alerta de deudor moroso
 */
export interface OverdueAlert {
    customerId: string;
    customerName: string;
    balance: number;
    daysOverdue: number;
    lastPaymentDate: Date | null;
}

/**
 * Respuesta paginada para cuentas
 */
interface PaginatedAccounts {
    data: CustomerAccount[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class CustomerAccountsService {
    constructor(
        @InjectRepository(CustomerAccount)
        private readonly accountRepo: Repository<CustomerAccount>,
        @InjectRepository(AccountMovement)
        private readonly movementRepo: Repository<AccountMovement>,
        private readonly customersService: CustomersService,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Obtiene o crea una cuenta corriente para un cliente
     */
    async getOrCreateAccount(customerId: string): Promise<CustomerAccount> {
        let account = await this.accountRepo.findOne({
            where: { customerId },
            relations: ['customer'],
        });

        if (!account) {
            // Verificar que el cliente existe
            await this.customersService.findOne(customerId);

            account = this.accountRepo.create({
                customerId,
                balance: 0,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
                daysOverdue: 0,
            });

            await this.accountRepo.save(account);

            // Recargar con relaciones
            account = await this.accountRepo.findOneOrFail({
                where: { id: account.id },
                relations: ['customer'],
            });
        }

        return account;
    }

    /**
     * Crea un cargo en la cuenta (desde venta)
     */
    async createCharge(customerId: string, dto: CreateChargeDto, userId?: string): Promise<AccountMovement> {
        const account = await this.getOrCreateAccount(customerId);

        // Verificar límite de crédito
        if (account.creditLimit > 0) {
            const newBalance = Number(account.balance) + dto.amount;
            if (newBalance > account.creditLimit) {
                throw new BadRequestException(
                    `El cliente ha excedido su límite de crédito ($${account.creditLimit}). Saldo actual: $${account.balance}`
                );
            }
        }

        // Verificar si está suspendido
        if (account.status === AccountStatus.SUSPENDED) {
            throw new BadRequestException('La cuenta del cliente está suspendida. No se pueden agregar cargos.');
        }

        // Crear movimiento dentro de una transacción
        return this.dataSource.transaction(async (manager) => {
            const balanceBefore = Number(account.balance);
            const chargeAmount = Math.abs(dto.amount);
            const balanceAfter = balanceBefore + chargeAmount;

            const movement = manager.create(AccountMovement, {
                accountId: account.id,
                movementType: MovementType.CHARGE,
                amount: chargeAmount, // Positivo = débito
                balanceBefore,
                balanceAfter,
                description: dto.description,
                referenceType: dto.saleId ? 'sale' : 'manual',
                referenceId: dto.saleId || null,
                notes: dto.notes || null,
                createdById: userId || null,
            });

            await manager.save(movement);

            // Actualizar saldo de la cuenta
            account.balance = balanceAfter;
            account.lastPurchaseDate = new Date();
            await manager.save(account);

            return movement;
        });
    }

    /**
     * Registra un pago del cliente
     */
    async createPayment(customerId: string, dto: CreatePaymentDto, userId?: string): Promise<AccountMovement> {
        const account = await this.getOrCreateAccount(customerId);

        const currentBalance = Number(account.balance);

        // Validar que hay deuda pendiente
        if (currentBalance <= 0) {
            throw new BadRequestException('El cliente no tiene deuda pendiente');
        }

        // Validar que el pago no excede la deuda
        if (dto.amount > currentBalance) {
            throw new BadRequestException(
                `El pago ($${dto.amount}) excede la deuda pendiente ($${currentBalance})`
            );
        }

        // Crear movimiento dentro de una transacción
        return this.dataSource.transaction(async (manager) => {
            const balanceBefore = currentBalance;
            const paymentAmount = Math.abs(dto.amount);
            const balanceAfter = balanceBefore - paymentAmount;

            const movement = manager.create(AccountMovement, {
                accountId: account.id,
                movementType: MovementType.PAYMENT,
                amount: -paymentAmount, // Negativo = crédito
                balanceBefore,
                balanceAfter,
                description: dto.description || 'Pago recibido',
                referenceType: 'payment',
                paymentMethodId: dto.paymentMethodId,
                notes: dto.notes || null,
                createdById: userId || null,
            });

            await manager.save(movement);

            // Actualizar saldo de la cuenta
            account.balance = balanceAfter;
            account.lastPaymentDate = new Date();

            // Si saldo = 0, resetear días de mora
            if (balanceAfter === 0) {
                account.daysOverdue = 0;
                if (account.status === AccountStatus.SUSPENDED) {
                    account.status = AccountStatus.ACTIVE;
                }
            }

            await manager.save(account);

            return movement;
        });
    }

    /**
     * Obtiene el estado de cuenta de un cliente
     */
    async getAccountStatement(customerId: string) {
        const account = await this.getOrCreateAccount(customerId);

        const movements = await this.movementRepo.find({
            where: { accountId: account.id },
            relations: ['createdBy', 'paymentMethod'],
            order: { createdAt: 'DESC' },
        });

        // Calcular totales
        const totalCharges = movements
            .filter(m => m.movementType === MovementType.CHARGE)
            .reduce((sum, m) => sum + Number(m.amount), 0);

        const totalPayments = movements
            .filter(m => m.movementType === MovementType.PAYMENT)
            .reduce((sum, m) => sum + Math.abs(Number(m.amount)), 0);

        const currentBalance = Number(account.balance);

        const summary: AccountStatementSummary = {
            totalCharges,
            totalPayments,
            currentBalance,
            customerPosition: this.getCustomerPosition(currentBalance),
        };

        return {
            account,
            movements,
            summary,
        };
    }

    /**
     * Lista todas las cuentas con filtros y paginación
     */
    async findAll(filters: AccountFiltersDto = {}): Promise<PaginatedAccounts> {
        const { page = 1, limit = 10, status, hasDebt, isOverdue, search } = filters;
        const skip = (page - 1) * limit;

        const query = this.accountRepo.createQueryBuilder('account')
            .leftJoinAndSelect('account.customer', 'customer')
            .orderBy('account.balance', 'DESC');

        if (status) {
            query.andWhere('account.status = :status', { status });
        }

        if (hasDebt) {
            query.andWhere('account.balance > 0');
        }

        if (isOverdue) {
            query.andWhere('account.daysOverdue > 0');
        }

        if (search) {
            query.andWhere(
                '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search)',
                { search: `%${search}%` }
            );
        }

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
     * Obtiene lista de clientes deudores
     */
    async getDebtors(): Promise<CustomerAccount[]> {
        return this.accountRepo.find({
            where: { balance: MoreThan(0) },
            relations: ['customer'],
            order: { balance: 'DESC' },
        });
    }

    /**
     * Actualiza límite de crédito y/o estado de una cuenta
     */
    async updateAccount(customerId: string, dto: UpdateAccountDto): Promise<CustomerAccount> {
        const account = await this.getOrCreateAccount(customerId);

        if (dto.creditLimit !== undefined) {
            account.creditLimit = dto.creditLimit;
        }

        if (dto.status !== undefined) {
            account.status = dto.status;
        }

        return this.accountRepo.save(account);
    }

    /**
     * Suspende la cuenta de un cliente
     */
    async suspendAccount(customerId: string): Promise<CustomerAccount> {
        const account = await this.getOrCreateAccount(customerId);
        account.status = AccountStatus.SUSPENDED;
        return this.accountRepo.save(account);
    }

    /**
     * Reactiva la cuenta de un cliente
     */
    async activateAccount(customerId: string): Promise<CustomerAccount> {
        const account = await this.getOrCreateAccount(customerId);
        account.status = AccountStatus.ACTIVE;
        return this.accountRepo.save(account);
    }

    /**
     * Obtiene estadísticas globales de cuentas corrientes
     */
    async getStats(): Promise<AccountStats> {
        const accounts = await this.accountRepo.find({
            relations: ['customer'],
        });

        const debtors = accounts.filter(a => Number(a.balance) > 0);
        const totalDebt = debtors.reduce((sum, a) => sum + Number(a.balance), 0);
        const overdueAccounts = accounts.filter(a => a.daysOverdue > 0);
        const totalOverdue = overdueAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

        return {
            totalAccounts: accounts.length,
            activeAccounts: accounts.filter(a => a.status === AccountStatus.ACTIVE).length,
            suspendedAccounts: accounts.filter(a => a.status === AccountStatus.SUSPENDED).length,
            totalDebtors: debtors.length,
            totalDebt,
            averageDebt: debtors.length > 0 ? totalDebt / debtors.length : 0,
            overdueAccounts: overdueAccounts.length,
            totalOverdue,
        };
    }

    /**
     * Obtiene alertas de deudores morosos
     * (para mostrar al inicio de cada mes)
     */
    async getOverdueAlerts(): Promise<OverdueAlert[]> {
        const overdueAccounts = await this.accountRepo.find({
            where: {
                balance: MoreThan(0),
                daysOverdue: MoreThan(0),
            },
            relations: ['customer'],
            order: { daysOverdue: 'DESC' },
        });

        return overdueAccounts.map(account => ({
            customerId: account.customerId,
            customerName: account.customer
                ? `${account.customer.firstName} ${account.customer.lastName}`
                : 'Cliente desconocido',
            balance: Number(account.balance),
            daysOverdue: account.daysOverdue,
            lastPaymentDate: account.lastPaymentDate,
        }));
    }

    /**
     * Actualiza días de mora de todas las cuentas
     * Se ejecuta automáticamente todos los días a las 3:00 AM
     */
    @Cron('0 3 * * *') // 3:00 AM todos los días
    async updateOverdueDays(): Promise<void> {
        console.log('[CustomerAccounts] Actualizando días de mora...');

        const accounts = await this.accountRepo.find({
            where: { balance: MoreThan(0) },
            relations: ['movements'],
        });

        for (const account of accounts) {
            // Buscar último cargo
            const charges = account.movements
                .filter(m => m.movementType === MovementType.CHARGE)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            const lastCharge = charges[0];

            if (lastCharge) {
                const daysSinceCharge = Math.floor(
                    (Date.now() - lastCharge.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                );

                account.daysOverdue = daysSinceCharge;

                // Suspender automáticamente si más de 30 días de mora
                if (daysSinceCharge > 30 && account.status === AccountStatus.ACTIVE) {
                    account.status = AccountStatus.SUSPENDED;
                    console.log(`[CustomerAccounts] Cuenta ${account.id} suspendida por mora (${daysSinceCharge} días)`);
                }

                await this.accountRepo.save(account);
            }
        }

        console.log(`[CustomerAccounts] Actualizadas ${accounts.length} cuentas`);
    }

    /**
     * Verifica deudores morosos al inicio de cada mes
     * Se ejecuta el día 1 de cada mes a las 8:00 AM
     */
    @Cron('0 8 1 * *') // 8:00 AM del día 1 de cada mes
    async checkOverdueAccountsMonthly(): Promise<void> {
        console.log('[CustomerAccounts] Verificación mensual de morosos...');

        const overdueAlerts = await this.getOverdueAlerts();

        if (overdueAlerts.length > 0) {
            console.log(`[CustomerAccounts] Hay ${overdueAlerts.length} clientes morosos:`);
            overdueAlerts.forEach(alert => {
                console.log(`  - ${alert.customerName}: $${alert.balance} (${alert.daysOverdue} días de mora)`);
            });
        } else {
            console.log('[CustomerAccounts] No hay clientes morosos');
        }
    }

    /**
     * Determina la posición del cliente según el balance
     */
    private getCustomerPosition(balance: number): 'customer_owes' | 'business_owes' | 'settled' {
        if (balance > 0) return 'customer_owes';
        if (balance < 0) return 'business_owes';
        return 'settled';
    }
}
