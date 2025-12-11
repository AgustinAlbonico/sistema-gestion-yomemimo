/**
 * Servicio de Compras
 * Gestiona el CRUD de compras con integración a inventario y gastos
 */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import {
    CreatePurchaseDto,
    UpdatePurchaseDto,
    PurchaseFiltersDto,
} from './dto';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { parseLocalDate } from '../../common/utils/date.utils';
import { StockMovementType, StockMovementSource } from '../inventory/entities/stock-movement.entity';

export interface PurchaseStats {
    totalPurchases: number;
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    purchasesByStatus: Record<PurchaseStatus, number>;
}

export interface PaginatedPurchases {
    data: Purchase[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class PurchasesService {
    constructor(
        @InjectRepository(Purchase)
        private readonly purchaseRepo: Repository<Purchase>,
        @InjectRepository(PurchaseItem)
        private readonly purchaseItemRepo: Repository<PurchaseItem>,
        private readonly inventoryService: InventoryService,
        private readonly productsService: ProductsService,
        private readonly cashRegisterService: CashRegisterService,
        private readonly suppliersService: SuppliersService,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Crea una nueva compra
     */
    async create(dto: CreatePurchaseDto, userId?: string): Promise<Purchase> {
        // Si la compra está pagada, validar que haya caja abierta
        if (dto.status === PurchaseStatus.PAID) {
            const openCashRegister = await this.cashRegisterService.getOpenRegister();
            if (!openCashRegister) {
                throw new BadRequestException(
                    'No hay caja abierta. Debe abrir la caja antes de registrar compras pagadas.'
                );
            }
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validar que todos los productos existan
            for (const item of dto.items) {
                const product = await this.productsService.findOne(item.productId);
                if (!product) {
                    throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
                }
            }

            // Generar número de compra
            const purchaseNumber = await this.generatePurchaseNumber();

            // Calcular subtotal y total
            const subtotal = dto.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            );
            const total = subtotal + (dto.tax || 0) - (dto.discount || 0);

            // Validar y obtener proveedor si se proporciona supplierId
            let supplierId: string | null = null;
            if (dto.supplierId) {
                const supplier = await this.suppliersService.findOne(dto.supplierId);
                if (supplier) {
                    supplierId = supplier.id;
                }
            }

            // Crear compra
            const purchase = this.purchaseRepo.create({
                purchaseNumber,
                supplierId,
                providerName: dto.providerName,
                providerDocument: dto.providerDocument ?? null,
                providerPhone: dto.providerPhone ?? null,
                purchaseDate: parseLocalDate(dto.purchaseDate),
                subtotal,
                tax: dto.tax ?? 0,
                discount: dto.discount ?? 0,
                total,
                status: dto.status ?? PurchaseStatus.PENDING,
                paymentMethodId: dto.paymentMethodId ?? null,
                paidAt: dto.paidAt ? parseLocalDate(dto.paidAt) : null,
                invoiceNumber: dto.invoiceNumber ?? null,
                notes: dto.notes ?? null,
                createdById: userId ?? null,
            });

            // Guardar compra
            const savedPurchase = await queryRunner.manager.save(purchase);

            // Crear items de compra
            const purchaseItems: PurchaseItem[] = [];
            for (const itemDto of dto.items) {
                const item = this.purchaseItemRepo.create({
                    purchaseId: savedPurchase.id,
                    productId: itemDto.productId,
                    quantity: itemDto.quantity,
                    unitPrice: itemDto.unitPrice,
                    subtotal: itemDto.quantity * itemDto.unitPrice,
                    notes: itemDto.notes ?? null,
                });
                purchaseItems.push(item);
            }
            await queryRunner.manager.save(purchaseItems);

            // Si se marca como pagada, actualizar inventario y registrar en caja
            if (dto.status === PurchaseStatus.PAID) {
                // Recargar la compra con los items desde el manager de la transacción
                const purchaseWithItems = await queryRunner.manager.findOne(Purchase, {
                    where: { id: savedPurchase.id },
                    relations: ['items', 'items.product'],
                });
                if (purchaseWithItems) {
                    await this.updateInventoryFromPurchase(purchaseWithItems);
                    savedPurchase.inventoryUpdated = true;
                    savedPurchase.paidAt = savedPurchase.paidAt ?? new Date();
                    await queryRunner.manager.save(savedPurchase);

                    // Registrar egreso en caja
                    if (dto.paymentMethodId) {
                        await this.cashRegisterService.registerPurchase(
                            { 
                                purchaseId: savedPurchase.id,
                                total: savedPurchase.total,
                                paymentMethodId: dto.paymentMethodId
                            },
                            userId || 'system'
                        );
                    }
                }
            }

            // Cargar la compra con relaciones usando el manager de la transacción
            const result = await queryRunner.manager.findOne(Purchase, {
                where: { id: savedPurchase.id },
                relations: ['items', 'items.product', 'createdBy', 'paymentMethod'],
            });

            await queryRunner.commitTransaction();

            if (!result) {
                throw new NotFoundException(`Compra con ID ${savedPurchase.id} no encontrada`);
            }

            return result;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Obtiene compras con filtros y paginación
     */
    async findAll(filters: PurchaseFiltersDto): Promise<PaginatedPurchases> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const skip = (page - 1) * limit;

        const query = this.purchaseRepo
            .createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .leftJoinAndSelect('purchase.createdBy', 'user')
            .leftJoinAndSelect('purchase.paymentMethod', 'paymentMethod')
            .where('purchase.deletedAt IS NULL')
            .orderBy('purchase.createdAt', 'DESC');

        // Aplicar filtros
        if (filters.providerName) {
            query.andWhere('purchase.providerName ILIKE :provider', {
                provider: `%${filters.providerName}%`,
            });
        }

        if (filters.status) {
            query.andWhere('purchase.status = :status', { status: filters.status });
        }

        if (filters.startDate && filters.endDate) {
            query.andWhere('purchase.purchaseDate BETWEEN :start AND :end', {
                start: filters.startDate,
                end: filters.endDate,
            });
        } else if (filters.startDate) {
            query.andWhere('purchase.purchaseDate >= :start', {
                start: filters.startDate,
            });
        } else if (filters.endDate) {
            query.andWhere('purchase.purchaseDate <= :end', {
                end: filters.endDate,
            });
        }

        if (filters.invoiceNumber) {
            query.andWhere('purchase.invoiceNumber ILIKE :invoice', {
                invoice: `%${filters.invoiceNumber}%`,
            });
        }

        if (filters.productId) {
            query.andWhere('items.productId = :productId', {
                productId: filters.productId,
            });
        }

        if (filters.search) {
            query.andWhere(
                '(purchase.purchaseNumber ILIKE :search OR purchase.providerName ILIKE :search OR purchase.invoiceNumber ILIKE :search)',
                { search: `%${filters.search}%` }
            );
        }

        // Ordenamiento
        const sortBy = filters.sortBy ?? 'purchaseDate';
        const order = filters.order ?? 'DESC';
        query.orderBy(`purchase.${sortBy}`, order);

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
     * Obtiene una compra por ID
     */
    async findOne(id: string): Promise<Purchase> {
        const purchase = await this.purchaseRepo.findOne({
            where: { id },
            relations: ['items', 'items.product', 'createdBy', 'paymentMethod'],
        });

        if (!purchase) {
            throw new NotFoundException(`Compra con ID ${id} no encontrada`);
        }

        return purchase;
    }

    /**
     * Actualiza una compra
     */
    async update(id: string, dto: UpdatePurchaseDto): Promise<Purchase> {
        const purchase = await this.findOne(id);

        if (purchase.status === PurchaseStatus.PAID) {
            throw new BadRequestException('No se puede modificar una compra ya pagada');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar campos
            if (dto.providerName !== undefined) purchase.providerName = dto.providerName;
            if (dto.providerDocument !== undefined) purchase.providerDocument = dto.providerDocument ?? null;
            if (dto.providerPhone !== undefined) purchase.providerPhone = dto.providerPhone ?? null;
            if (dto.invoiceNumber !== undefined) purchase.invoiceNumber = dto.invoiceNumber ?? null;
            if (dto.notes !== undefined) purchase.notes = dto.notes ?? null;
            if (dto.paymentMethodId !== undefined) purchase.paymentMethodId = dto.paymentMethodId ?? null;

            // Actualizar impuesto/descuento y recalcular total
            if (dto.tax !== undefined) purchase.tax = dto.tax;
            if (dto.discount !== undefined) purchase.discount = dto.discount;
            purchase.total = purchase.subtotal + purchase.tax - purchase.discount;

            // Si cambia a PAID y no se ha actualizado inventario
            if (dto.status === PurchaseStatus.PAID && !purchase.inventoryUpdated) {
                await this.updateInventoryFromPurchase(purchase);
                purchase.inventoryUpdated = true;
                purchase.paidAt = dto.paidAt ? parseLocalDate(dto.paidAt) : new Date();
            }

            if (dto.status !== undefined) purchase.status = dto.status;

            await queryRunner.manager.save(purchase);
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
     * Elimina una compra (soft delete)
     */
    async remove(id: string): Promise<{ message: string }> {
        const purchase = await this.findOne(id);

        if (purchase.status === PurchaseStatus.PAID) {
            throw new BadRequestException(
                'No se puede eliminar una compra ya pagada (el inventario fue actualizado)'
            );
        }

        await this.purchaseRepo.softDelete(id);
        return { message: 'Compra eliminada' };
    }

    /**
     * Marca una compra como pagada y actualiza inventario
     */
    async markAsPaid(id: string, paymentMethodId: string, userId: string): Promise<Purchase> {
        // Validar que haya caja abierta
        const openCashRegister = await this.cashRegisterService.getOpenRegister();
        if (!openCashRegister) {
            throw new BadRequestException(
                'No hay caja abierta. Debe abrir la caja antes de marcar compras como pagadas.'
            );
        }

        const purchase = await this.findOne(id);

        if (purchase.status === PurchaseStatus.PAID) {
            throw new BadRequestException('La compra ya está pagada');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Actualizar inventario si no se ha hecho
            if (!purchase.inventoryUpdated) {
                await this.updateInventoryFromPurchase(purchase);
                purchase.inventoryUpdated = true;
            }

            purchase.status = PurchaseStatus.PAID;
            purchase.paidAt = new Date();
            purchase.paymentMethodId = paymentMethodId;

            await queryRunner.manager.save(purchase);

            // Registrar egreso en caja
            await this.cashRegisterService.registerPurchase(
                { 
                    purchaseId: purchase.id,
                    total: purchase.total,
                    paymentMethodId: paymentMethodId
                },
                userId
            );

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
     * Actualiza inventario desde una compra
     * @param purchase - Objeto Purchase con items cargados
     */
    private async updateInventoryFromPurchase(purchase: Purchase): Promise<void> {
        // purchaseDate puede ser Date o string dependiendo de cómo venga de la DB
        const dateString = typeof purchase.purchaseDate === 'string'
            ? purchase.purchaseDate
            : purchase.purchaseDate.toISOString();

        for (const item of purchase.items) {
            // Usar el servicio de inventario para crear movimiento
            await this.inventoryService.createMovement({
                productId: item.productId,
                type: StockMovementType.IN,
                source: StockMovementSource.PURCHASE,
                quantity: item.quantity,
                cost: item.unitPrice,
                provider: purchase.providerName,
                referenceId: purchase.purchaseNumber,
                notes: `Ingreso por compra ${purchase.purchaseNumber}`,
                date: dateString,
            });
        }
    }

    /**
     * Genera número de compra único
     */
    private async generatePurchaseNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.purchaseRepo.count({
            where: { purchaseNumber: Like(`COMP-${year}-%`) },
            withDeleted: true,
        });

        const nextNumber = (count + 1).toString().padStart(5, '0');
        return `COMP-${year}-${nextNumber}`;
    }

    /**
     * Obtiene estadísticas de compras
     */
    async getStats(startDate?: string, endDate?: string): Promise<PurchaseStats> {
        const query = this.purchaseRepo
            .createQueryBuilder('purchase')
            .where('purchase.deletedAt IS NULL');

        if (startDate && endDate) {
            query.andWhere('purchase.purchaseDate BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            });
        }

        const purchases = await query.getMany();

        const totalPurchases = purchases.length;

        const totalAmount = purchases
            .reduce((sum, p) => sum + Number(p.total), 0);

        const totalPaid = purchases
            .filter((p) => p.status === PurchaseStatus.PAID)
            .reduce((sum, p) => sum + Number(p.total), 0);

        const totalPending = purchases
            .filter((p) => p.status === PurchaseStatus.PENDING)
            .reduce((sum, p) => sum + Number(p.total), 0);

        // Contar por estado
        const purchasesByStatus = {
            [PurchaseStatus.PENDING]: 0,
            [PurchaseStatus.PAID]: 0,
        };

        for (const purchase of purchases) {
            purchasesByStatus[purchase.status]++;
        }

        return {
            totalPurchases,
            totalAmount,
            totalPaid,
            totalPending,
            purchasesByStatus,
        };
    }

    /**
     * Obtiene proveedores únicos (para autocompletado)
     */
    async getProviders(): Promise<string[]> {
        const result = await this.purchaseRepo
            .createQueryBuilder('purchase')
            .select('DISTINCT purchase.providerName', 'providerName')
            .where('purchase.deletedAt IS NULL')
            .orderBy('purchase.providerName', 'ASC')
            .getRawMany();

        return result.map((r) => r.providerName);
    }
}

