/**
 * Servicio de Ventas
 * Gestiona el CRUD de ventas con integración a inventario
 */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { SaleTax } from './entities/sale-tax.entity';
import {
    CreateSaleDto,
    UpdateSaleDto,
    SaleFiltersDto,
} from './dto';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { InvoiceService } from './services/invoice.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomerAccountsService } from '../customer-accounts/customer-accounts.service';
import { StockMovementType, StockMovementSource } from '../inventory/entities/stock-movement.entity';
import { parseLocalDate } from '../../common/utils/date.utils';

export interface SaleStats {
    totalSales: number;
    totalAmount: number;
    totalCompleted: number;
    totalPending: number;
    salesByStatus: Record<SaleStatus, number>;
    salesByPaymentMethod: Record<string, number>;
}

export interface PaginatedSales {
    data: Sale[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(Sale)
        private readonly saleRepo: Repository<Sale>,
        @InjectRepository(SaleItem)
        private readonly saleItemRepo: Repository<SaleItem>,
        @InjectRepository(SalePayment)
        private readonly salePaymentRepo: Repository<SalePayment>,
        @InjectRepository(SaleTax)
        private readonly saleTaxRepo: Repository<SaleTax>,
        private readonly inventoryService: InventoryService,
        private readonly productsService: ProductsService,
        private readonly invoiceService: InvoiceService,
        private readonly cashRegisterService: CashRegisterService,
        private readonly customerAccountsService: CustomerAccountsService,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Crea una nueva venta
     */
    async create(dto: CreateSaleDto, userId?: string): Promise<Sale> {
        // Validar que haya caja abierta antes de crear la venta
        const openCashRegister = await this.cashRegisterService.getOpenRegister();
        if (!openCashRegister) {
            throw new BadRequestException(
                'No hay caja abierta. Debe abrir la caja antes de registrar ventas.'
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validar que todos los productos existan y tengan stock
            for (const item of dto.items) {
                const product = await this.productsService.findOne(item.productId);
                if (!product) {
                    throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
                }
                if (product.stock < item.quantity) {
                    throw new BadRequestException(
                        `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`
                    );
                }
            }

            // Generar número de venta
            const saleNumber = await this.generateSaleNumber();

            // Calcular subtotal
            const subtotal = dto.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
                0
            );

            // Calcular impuestos
            let totalTax = dto.tax || 0;
            if (dto.taxes && dto.taxes.length > 0) {
                totalTax = dto.taxes.reduce((sum, tax) => sum + tax.amount, 0);
            }

            const total = subtotal + totalTax - (dto.discount || 0) + (dto.surcharge || 0);

            // Determinar estado
            let status = dto.status ?? SaleStatus.COMPLETED;
            if (dto.isOnAccount) {
                status = SaleStatus.PENDING;
            }

            // Validar pagos si no es cuenta corriente
            if (!dto.isOnAccount && dto.payments) {
                const totalPayments = dto.payments.reduce((sum, p) => sum + p.amount, 0);
                if (Math.abs(totalPayments - total) > 0.01) {
                    throw new BadRequestException(
                        `El total de pagos ($${totalPayments.toFixed(2)}) no coincide con el total de la venta ($${total.toFixed(2)})`
                    );
                }
            }

            // Crear venta
            const sale = this.saleRepo.create({
                saleNumber,
                customerId: dto.customerId ?? null,
                customerName: dto.customerName ?? null,
                saleDate: dto.saleDate ? parseLocalDate(dto.saleDate) : new Date(),
                subtotal,
                discount: dto.discount ?? 0,
                surcharge: dto.surcharge ?? 0,
                tax: totalTax,
                total,
                status,
                isOnAccount: dto.isOnAccount ?? false,
                notes: dto.notes ?? null,
                createdById: userId ?? null,
            });

            const savedSale = await queryRunner.manager.save(sale);

            // Crear items de venta
            for (const itemDto of dto.items) {
                const product = await this.productsService.findOne(itemDto.productId);
                const item = this.saleItemRepo.create({
                    saleId: savedSale.id,
                    productId: itemDto.productId,
                    productCode: product.sku ?? null,
                    productDescription: product.name,
                    quantity: itemDto.quantity,
                    unitPrice: itemDto.unitPrice,
                    discount: itemDto.discount ?? 0,
                    discountPercent: itemDto.discountPercent ?? 0,
                    subtotal: (itemDto.quantity * itemDto.unitPrice) - (itemDto.discount || 0),
                });
                await queryRunner.manager.save(item);
            }

            // Crear impuestos si existen
            if (dto.taxes && dto.taxes.length > 0) {
                for (const taxDto of dto.taxes) {
                    const tax = this.saleTaxRepo.create({
                        saleId: savedSale.id,
                        name: taxDto.name,
                        percentage: taxDto.percentage ?? null,
                        amount: taxDto.amount,
                    });
                    await queryRunner.manager.save(tax);
                }
            }

            // Crear pagos si existen
            if (dto.payments && dto.payments.length > 0) {
                for (const paymentDto of dto.payments) {
                    const payment = this.salePaymentRepo.create({
                        saleId: savedSale.id,
                        paymentMethodId: paymentDto.paymentMethodId,
                        amount: paymentDto.amount,
                        installments: paymentDto.installments ?? null,
                        cardLastFourDigits: paymentDto.cardLastFourDigits ?? null,
                        authorizationCode: paymentDto.authorizationCode ?? null,
                        referenceNumber: paymentDto.referenceNumber ?? null,
                        notes: paymentDto.notes ?? null,
                    });
                    await queryRunner.manager.save(payment);
                }
            }

            // Si la venta está completa, actualizar inventario
            if (status === SaleStatus.COMPLETED) {
                await this.updateInventoryFromSale(savedSale.id, queryRunner.manager);
                savedSale.inventoryUpdated = true;
                await queryRunner.manager.save(savedSale);
            }

            // Si es venta a cuenta corriente, registrar cargo en cuenta del cliente
            if (dto.isOnAccount && dto.customerId) {
                console.log(`[Ventas] Registrando cargo en cuenta corriente del cliente ${dto.customerId}...`);
                await this.customerAccountsService.createCharge(
                    dto.customerId,
                    {
                        amount: total,
                        description: `Venta ${saleNumber}`,
                        saleId: savedSale.id,
                        notes: dto.notes || undefined,
                    },
                    userId
                );
                console.log(`[Ventas] Cargo registrado exitosamente: $${total}`);
            }

            // Cargar venta completa con todas sus relaciones ANTES del commit
            let completedSale = await queryRunner.manager.findOne(Sale, {
                where: { id: savedSale.id },
                relations: ['items', 'items.product', 'payments', 'customer', 'createdBy', 'invoice'],
            });

            // Generar factura si se solicitó
            // Si falla, la venta se crea igual pero con fiscalPending=true
            if (dto.generateInvoice && completedSale) {
                console.log(`[Ventas] Generando factura fiscal para venta ${savedSale.id}...`);
                try {
                    await this.invoiceService.generateInvoice(savedSale.id, queryRunner.manager);

                    // Recargar venta con la factura generada
                    completedSale = await queryRunner.manager.findOne(Sale, {
                        where: { id: savedSale.id },
                        relations: ['items', 'items.product', 'payments', 'customer', 'createdBy', 'invoice'],
                    });
                } catch (invoiceErr) {
                    // Si falla la facturación, marcar la venta como pendiente de factura
                    const errorMsg = (invoiceErr as Error).message;
                    console.error(`[Ventas] Error al generar factura fiscal: ${errorMsg}`);

                    savedSale.fiscalPending = true;
                    savedSale.fiscalError = errorMsg;
                    await queryRunner.manager.save(savedSale);

                    // Recargar venta con el estado actualizado
                    completedSale = await queryRunner.manager.findOne(Sale, {
                        where: { id: savedSale.id },
                        relations: ['items', 'items.product', 'payments', 'customer', 'createdBy', 'invoice'],
                    });
                }
            }

            await queryRunner.commitTransaction();

            // Registrar ingresos en caja (después del commit para evitar problemas con la transacción)
            if (status === SaleStatus.COMPLETED && completedSale?.payments && completedSale.payments.length > 0) {
                for (const payment of completedSale.payments) {
                    // Registrar todos los métodos de pago en la caja
                    try {
                        await this.cashRegisterService.registerIncome(
                            {
                                salePaymentId: payment.id,
                            },
                            userId || 'system'
                        );
                        console.log(`[Ventas] Ingreso registrado en caja: ${payment.amount} (${payment.paymentMethodId})`);
                    } catch (cashErr) {
                        // Si falla el registro en caja, solo loguear el error
                        // No queremos que falle la venta por esto
                        console.warn(`[Ventas] No se pudo registrar ingreso en caja: ${(cashErr as Error).message}`);
                    }
                }
            }

            return completedSale!;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Obtiene ventas con filtros y paginación
     */
    async findAll(filters: SaleFiltersDto): Promise<PaginatedSales> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const skip = (page - 1) * limit;

        const query = this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .leftJoinAndSelect('sale.payments', 'payments')
            .leftJoinAndSelect('sale.customer', 'customer')
            .leftJoinAndSelect('sale.createdBy', 'user')
            .leftJoinAndSelect('sale.invoice', 'invoice')
            .where('sale.deletedAt IS NULL');

        // Aplicar filtros
        if (filters.search) {
            query.andWhere(
                '(sale.saleNumber ILIKE :search OR sale.customerName ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search)',
                { search: `%${filters.search}%` }
            );
        }

        if (filters.status) {
            query.andWhere('sale.status = :status', { status: filters.status });
        }

        if (filters.startDate && filters.endDate) {
            query.andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', {
                start: filters.startDate,
                end: filters.endDate,
            });
        } else if (filters.startDate) {
            query.andWhere('DATE(sale.saleDate) >= :start', {
                start: filters.startDate,
            });
        } else if (filters.endDate) {
            query.andWhere('DATE(sale.saleDate) <= :end', {
                end: filters.endDate,
            });
        }

        if (filters.customerId) {
            query.andWhere('sale.customerId = :customerId', {
                customerId: filters.customerId,
            });
        }

        if (filters.productId) {
            query.andWhere('items.productId = :productId', {
                productId: filters.productId,
            });
        }

        if (filters.fiscalPending !== undefined) {
            query.andWhere('sale.fiscalPending = :fiscalPending', {
                fiscalPending: filters.fiscalPending,
            });
        }

        // Filtro por estado de facturación
        if (filters.invoiceStatus) {
            switch (filters.invoiceStatus) {
                case 'fiscal':
                    // Ventas con factura fiscal autorizada
                    query.andWhere('sale.isFiscal = :isFiscal', { isFiscal: true });
                    break;
                case 'no_fiscal':
                    // Ventas sin factura fiscal (nunca se intentó facturar)
                    // Incluye NULL para manejar ventas antiguas o con valores por defecto
                    query.andWhere('sale.isFiscal = :isFiscal', { isFiscal: false });
                    query.andWhere('(sale.fiscalPending IS NULL OR sale.fiscalPending = :fiscalPending)',
                        { fiscalPending: false });
                    break;
                case 'error':
                    // Ventas con error en facturación
                    // Debe tener fiscalPending = true (indica que se intentó facturar pero falló)
                    query.andWhere('sale.fiscalPending = :fiscalPending', { fiscalPending: true });
                    query.andWhere('sale.isFiscal = :isFiscal', { isFiscal: false });
                    break;
                case 'pending':
                    // Ventas pendientes de facturación (se solicitó pero aún no se procesó)
                    query.andWhere('invoice.status = :invoiceStatus', { invoiceStatus: 'pending' });
                    break;
            }
        }

        // Ordenamiento
        // Ordenar por saleNumber descendente por defecto
        const sortBy = filters.sortBy ?? 'saleNumber';
        const order = filters.order ?? 'DESC';
        query.orderBy(`sale.${sortBy}`, order);

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
     * Obtiene una venta por ID
     */
    async findOne(id: string): Promise<Sale> {
        const sale = await this.saleRepo.findOne({
            where: { id },
            relations: ['items', 'items.product', 'payments', 'customer', 'createdBy', 'invoice'],
        });

        if (!sale) {
            throw new NotFoundException(`Venta con ID ${id} no encontrada`);
        }

        return sale;
    }

    /**
     * Actualiza una venta
     */
    async update(id: string, dto: UpdateSaleDto): Promise<Sale> {
        const sale = await this.findOne(id);

        if (sale.status === SaleStatus.CANCELLED) {
            throw new BadRequestException('No se puede modificar una venta cancelada');
        }

        if (sale.inventoryUpdated) {
            throw new BadRequestException('No se puede modificar una venta que ya actualizó el inventario');
        }

        // Actualizar campos
        if (dto.customerId !== undefined) sale.customerId = dto.customerId ?? null;
        if (dto.customerName !== undefined) sale.customerName = dto.customerName ?? null;
        if (dto.notes !== undefined) sale.notes = dto.notes ?? null;
        if (dto.isOnAccount !== undefined) sale.isOnAccount = dto.isOnAccount;

        // Actualizar impuesto/descuento y recalcular total
        if (dto.tax !== undefined) sale.tax = dto.tax;
        if (dto.discount !== undefined) sale.discount = dto.discount;
        if (dto.surcharge !== undefined) sale.surcharge = dto.surcharge;
        sale.total = sale.subtotal + sale.tax - sale.discount + sale.surcharge;

        if (dto.status !== undefined) sale.status = dto.status;

        await this.saleRepo.save(sale);

        return this.findOne(id);
    }

    /**
     * Cancela una venta
     */
    async cancel(id: string): Promise<Sale> {
        const sale = await this.findOne(id);

        if (sale.status === SaleStatus.CANCELLED) {
            throw new BadRequestException('La venta ya está cancelada');
        }

        // Si ya se actualizó el inventario, revertir
        if (sale.inventoryUpdated) {
            await this.revertInventoryFromSale(sale);
            sale.inventoryUpdated = false;
        }

        sale.status = SaleStatus.CANCELLED;
        return this.saleRepo.save(sale);
    }

    /**
     * Elimina una venta (soft delete)
     */
    async remove(id: string): Promise<{ message: string }> {
        const sale = await this.findOne(id);

        if (sale.inventoryUpdated) {
            throw new BadRequestException(
                'No se puede eliminar una venta que ya actualizó el inventario. Cancélela primero.'
            );
        }

        await this.saleRepo.softDelete(id);
        return { message: 'Venta eliminada' };
    }

    /**
     * Marca una venta pendiente como pagada
     */
    async markAsPaid(id: string, payments: any[]): Promise<Sale> {
        const sale = await this.findOne(id);

        if (sale.status === SaleStatus.CANCELLED) {
            throw new BadRequestException('No se puede pagar una venta cancelada');
        }

        if (sale.status === SaleStatus.COMPLETED) {
            throw new BadRequestException('La venta ya está completada');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Crear pagos
            for (const paymentDto of payments) {
                const payment = this.salePaymentRepo.create({
                    saleId: sale.id,
                    paymentMethodId: paymentDto.paymentMethodId,
                    amount: paymentDto.amount,
                    installments: paymentDto.installments ?? null,
                    cardLastFourDigits: paymentDto.cardLastFourDigits ?? null,
                    authorizationCode: paymentDto.authorizationCode ?? null,
                    referenceNumber: paymentDto.referenceNumber ?? null,
                    notes: paymentDto.notes ?? null,
                });
                await queryRunner.manager.save(payment);
            }

            // Actualizar inventario si no se ha hecho
            if (!sale.inventoryUpdated) {
                await this.updateInventoryFromSale(id, queryRunner.manager);
                sale.inventoryUpdated = true;
            }

            sale.status = SaleStatus.COMPLETED;
            sale.isOnAccount = false;

            await queryRunner.manager.save(sale);
            await queryRunner.commitTransaction();

            return this.findOne(id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Obtiene ventas del día actual
     */
    async getTodaySales(): Promise<Sale[]> {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        return this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('sale.payments', 'payments')
            .leftJoinAndSelect('sale.customer', 'customer')
            .where('sale.saleDate BETWEEN :start AND :end', {
                start: startOfDay,
                end: endOfDay,
            })
            .andWhere('sale.deletedAt IS NULL')
            .orderBy('sale.saleDate', 'DESC')
            .getMany();
    }

    /**
     * Obtiene estadísticas de ventas
     */
    async getStats(startDate?: string, endDate?: string): Promise<SaleStats> {
        const query = this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.payments', 'payments')
            .leftJoinAndSelect('payments.paymentMethod', 'paymentMethod')
            .where('sale.deletedAt IS NULL');

        if (startDate && endDate) {
            query.andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            });
        }

        const sales = await query.getMany();

        const totalSales = sales.length;

        const totalAmount = sales
            .filter((s) => s.status !== SaleStatus.CANCELLED)
            .reduce((sum, s) => sum + Number(s.total), 0);

        const totalCompleted = sales
            .filter((s) => s.status === SaleStatus.COMPLETED)
            .reduce((sum, s) => sum + Number(s.total), 0);

        const totalPending = sales
            .filter((s) => s.status === SaleStatus.PENDING || s.status === SaleStatus.PARTIAL)
            .reduce((sum, s) => sum + Number(s.total), 0);

        // Contar por estado
        const salesByStatus = {
            [SaleStatus.COMPLETED]: 0,
            [SaleStatus.PENDING]: 0,
            [SaleStatus.PARTIAL]: 0,
            [SaleStatus.CANCELLED]: 0,
        };

        for (const sale of sales) {
            salesByStatus[sale.status]++;
        }

        // Contar por método de pago
        const salesByPaymentMethod: Record<string, number> = {};
        for (const sale of sales) {
            for (const payment of sale.payments || []) {
                const method = payment.paymentMethod?.name ?? 'Desconocido';
                salesByPaymentMethod[method] = (salesByPaymentMethod[method] || 0) + Number(payment.amount);
            }
        }

        return {
            totalSales,
            totalAmount,
            totalCompleted,
            totalPending,
            salesByStatus,
            salesByPaymentMethod,
        };
    }

    /**
     * Actualiza inventario desde una venta (resta stock)
     */
    private async updateInventoryFromSale(
        saleId: string,
        manager: any
    ): Promise<void> {
        // Usar el manager de la transacción para obtener la venta
        // Esto evita el error 404 que ocurre con this.findOne dentro de una transacción no commiteada
        const sale = await manager.findOne(Sale, {
            where: { id: saleId },
            relations: ['items'],
        });

        if (!sale) {
            throw new NotFoundException(`Venta con ID ${saleId} no encontrada`);
        }

        for (const item of sale.items) {
            // saleDate puede ser Date o string dependiendo del contexto de la transacción
            const saleDateStr = sale.saleDate instanceof Date
                ? sale.saleDate.toISOString()
                : String(sale.saleDate);

            await this.inventoryService.createMovement({
                productId: item.productId,
                type: StockMovementType.OUT,
                source: StockMovementSource.SALE,
                quantity: item.quantity,
                cost: item.unitPrice,
                referenceId: sale.saleNumber,
                notes: `Venta ${sale.saleNumber}`,
                date: saleDateStr,
            });
        }
    }

    /**
     * Revierte inventario de una venta cancelada (suma stock)
     */
    private async revertInventoryFromSale(sale: Sale): Promise<void> {
        for (const item of sale.items) {
            await this.inventoryService.createMovement({
                productId: item.productId,
                type: StockMovementType.IN,
                source: StockMovementSource.RETURN,
                quantity: item.quantity,
                cost: item.unitPrice,
                referenceId: sale.saleNumber,
                notes: `Cancelación venta ${sale.saleNumber}`,
                date: new Date().toISOString(),
            });
        }
    }

    /**
     * Genera número de venta único
     */
    private async generateSaleNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.saleRepo.count({
            where: { saleNumber: Like(`VENTA-${year}-%`) },
            withDeleted: true,
        });

        const nextNumber = (count + 1).toString().padStart(5, '0');
        return `VENTA-${year}-${nextNumber}`;
    }
}

