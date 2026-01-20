/**
 * Helpers comunes para testing del módulo de ventas
 * Facilita la creación de mocks y verificaciones
 */

import { EntityManager, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { Sale, SaleStatus } from '../../src/modules/sales/entities/sale.entity';
import { SaleItem } from '../../src/modules/sales/entities/sale-item.entity';
import { SalePayment } from '../../src/modules/sales/entities/sale-payment.entity';
import { SaleTax } from '../../src/modules/sales/entities/sale-tax.entity';
import { Invoice, InvoiceStatus, InvoiceType } from '../../src/modules/sales/entities/invoice.entity';
import { AuditAction, AuditEntityType } from '../../src/modules/audit/enums';

/**
 * Crea un mock de QueryRunner con transacción
 */
export const mockQueryRunner = (): QueryRunner => {
    const savedEntities = new Map<string, unknown[]>();

    return {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
            query: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockImplementation(async (entity: unknown) => {
                if (!entity) return { id: 'generated-id' };
                const typedEntity = entity as Record<string, unknown>;
                const savedEntity = {
                    ...typedEntity,
                    id: typedEntity.id || `generated-${Date.now()}-${Math.random()}`,
                };
                return savedEntity;
            }),
            findOne: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            getRepository: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orWhere: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
                getMany: jest.fn().mockResolvedValue([]),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
                execute: jest.fn().mockResolvedValue(undefined),
            }),
        },
        isTransactionActive: true,
        isReleased: false,
    } as unknown as QueryRunner;
};

/**
 * Crea un mock de EntityManager
 */
export const mockEntityManager = (): EntityManager => {
    return {
        save: jest.fn().mockImplementation(async (entity: unknown) => {
            if (!entity) return { id: 'generated-id' };
            const typedEntity = entity as Record<string, unknown>;
            return { ...typedEntity, id: typedEntity.id || `generated-${Date.now()}` };
        }),
        findOne: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        getRepository: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
            getMany: jest.fn().mockResolvedValue([]),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        }),
        transaction: jest.fn((callback: (manager: EntityManager) => Promise<unknown>) => {
            return callback(mockEntityManager() as EntityManager);
        }),
    } as unknown as EntityManager;
};

/**
 * Crea un mock de Repository
 */
export const mockRepository = <T = any>(): Repository<any> => {
    return {
        create: jest.fn().mockImplementation((entity) => entity),
        save: jest.fn().mockImplementation(async (entity) => {
            if (!entity) return { id: 'generated-id' };
            const typedEntity = entity as Record<string, unknown>;
            return { ...typedEntity, id: typedEntity.id || `generated-id` };
        }),
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
    } as unknown as Repository<any>;
};

/**
 * Crea un mock de SelectQueryBuilder encadenable
 */
export const createMockQueryBuilder = <T = any>(): SelectQueryBuilder<any> => {
    const qb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        getMany: jest.fn().mockResolvedValue([]),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
    };

    return qb as unknown as SelectQueryBuilder<any>;
};

/**
 * Crea una venta completa con todas sus relaciones
 */
export const createMockSaleWithRelations = (overrides: Partial<Sale> = {}): Sale => {
    const sale: Sale = {
        id: `sale-${Date.now()}`,
        saleNumber: 'VENTA-2026-00001',
        customerId: `customer-${Date.now()}`,
        customerName: 'Cliente Test',
        saleDate: new Date(),
        subtotal: 100,
        discount: 0,
        surcharge: 0,
        tax: 0,
        total: 100,
        status: SaleStatus.COMPLETED,
        isOnAccount: false,
        inventoryUpdated: true,
        isFiscal: false,
        fiscalPending: false,
        ivaPercentage: null,
        fiscalError: null,
        notes: null,
        createdById: `user-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,

        // Relaciones
        items: [],
        payments: [],
        taxes: [],
        customer: null,
        createdBy: null,
        invoice: null,

        ...overrides,
    };

    return sale;
};

/**
 * Crea un mock de SaleItem
 */
export const createMockSaleItem = (overrides: Partial<SaleItem> = {}): SaleItem => {
    return {
        id: `item-${Date.now()}`,
        saleId: `sale-${Date.now()}`,
        productId: `product-${Date.now()}`,
        productCode: 'SKU001',
        productDescription: 'Producto Test',
        quantity: 1,
        unitOfMeasure: 'unidades',
        unitPrice: 100,
        discount: 0,
        discountPercent: 0,
        subtotal: 100,
        sale: null as any,
        product: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as SaleItem;
};

/**
 * Crea un mock de SalePayment
 */
export const createMockSalePayment = (overrides: Partial<SalePayment> = {}): SalePayment => {
    return {
        id: `payment-${Date.now()}`,
        saleId: `sale-${Date.now()}`,
        paymentMethodId: `payment-method-${Date.now()}`,
        amount: 100,
        installments: null,
        cardLastFourDigits: null,
        authorizationCode: null,
        referenceNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sale: null as any,
        paymentMethod: null as any,
        ...overrides,
    } as SalePayment;
};

/**
 * Crea un mock de Invoice
 */
export const createMockInvoice = (overrides: Partial<Invoice> = {}): Invoice => {
    const now = new Date();
    const caeExpiration = new Date(now);
    caeExpiration.setDate(caeExpiration.getDate() + 10);

    return {
        id: `invoice-${Date.now()}`,
        saleId: `sale-${Date.now()}`,
        invoiceType: InvoiceType.FACTURA_C,
        pointOfSale: 1,
        invoiceNumber: 1001,
        issueDate: now,

        emitterCuit: '20123456789',
        emitterBusinessName: 'Mi Negocio',
        emitterAddress: 'Av. Corrientes 1234',
        emitterIvaCondition: 'RESPONSABLE_MONOTRIBUTO',
        emitterGrossIncome: '901-123456-1',
        emitterActivityStartDate: new Date('2020-01-01'),

        receiverDocumentType: 99,
        receiverDocumentNumber: null,
        receiverName: 'Consumidor Final',
        receiverAddress: null,
        receiverIvaCondition: 'CONSUMIDOR_FINAL',

        subtotal: 100,
        discount: 0,
        otherTaxes: 0,
        total: 100,

        netAmount: 100,
        iva21: 0,
        iva105: 0,
        iva27: 0,
        netAmountExempt: 0,

        saleCondition: 'Contado',
        status: InvoiceStatus.AUTHORIZED,
        cae: '12345678901234',
        caeExpirationDate: caeExpiration,

        qrData: 'qr-data-test',
        pdfPath: null,

        afipResponse: JSON.stringify({ success: true }),
        afipErrorMessage: null,

        createdAt: now,
        updatedAt: now,

        sale: null as any,

        ...overrides,
    } as Invoice;
};

/**
 * Calcula los totales de una venta
 */
export const calculateSaleTotals = (
    items: Array<{ quantity: number; unitPrice: number; discount?: number }>,
    discountGlobal = 0,
    tax = 0,
    surcharge = 0
): { subtotal: number; total: number } => {
    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
        0
    );
    const total = subtotal - discountGlobal + tax + surcharge;
    return { subtotal, total };
};

/**
 * Verifica que una venta tenga los cálculos correctos
 */
export const assertSaleCalculations = (sale: Sale, items: Array<{ quantity: number; unitPrice: number; discount?: number }>): void => {
    const expectedSubtotal = items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice) - (item.discount || 0),
        0
    );
    const expectedTotal = expectedSubtotal - Number(sale.discount) + Number(sale.tax) + Number(sale.surcharge);

    expect(Number(sale.subtotal)).toBeCloseTo(expectedSubtotal, 2);
    expect(Number(sale.total)).toBeCloseTo(expectedTotal, 2);
};

/**
 * Verifica que el servicio de auditoría fue llamado correctamente
 */
export const verifyAuditLogCalled = (
    auditServiceMock: { logSilent: jest.Mock },
    action: AuditAction,
    entityType: AuditEntityType,
    userId: string
): void => {
    expect(auditServiceMock.logSilent).toHaveBeenCalledWith(
        expect.objectContaining({
            action,
            entityType,
            userId,
        })
    );
};

/**
 * Verifica que el servicio de auditoría fue llamado con valores previos y nuevos
 */
export const verifyAuditLogWithValues = (
    auditServiceMock: { logSilent: jest.Mock },
    action: AuditAction,
    entityType: AuditEntityType,
    userId: string,
    previousValues: Record<string, unknown>,
    newValues: Record<string, unknown>
): void => {
    expect(auditServiceMock.logSilent).toHaveBeenCalledWith(
        expect.objectContaining({
            action,
            entityType,
            userId,
            previousValues,
            newValues,
        })
    );
};

/**
 * Crea un mock de DataSource con QueryRunner
 */
export const mockDataSource = (queryRunnerOverride?: Partial<QueryRunner>) => {
    const qr = mockQueryRunner();
    return {
        createQueryRunner: jest.fn().mockReturnValue({
            ...qr,
            ...queryRunnerOverride,
        }),
    } as unknown as { createQueryRunner: () => QueryRunner };
};

/**
 * Helper para esperar un delay en tests asíncronos
 */
export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Crea un array de items de venta para testing
 */
export const createTestItems = (count: number): Array<{ productId: string; quantity: number; unitPrice: number }> => {
    return Array.from({ length: count }, (_, i) => ({
        productId: `product-${i + 1}`,
        quantity: i + 1,
        unitPrice: (i + 1) * 100,
    }));
};

/**
 * Crea un array de pagos para testing
 */
export const createTestPayments = (amounts: number[], paymentMethodIds?: string[]): Array<{ paymentMethodId: string; amount: number }> => {
    return amounts.map((amount, i) => ({
        paymentMethodId: paymentMethodIds?.[i] || `payment-method-${i}`,
        amount,
    }));
};

/**
 * Verifica que un error sea del tipo correcto y tenga el mensaje esperado
 */
export const assertError = (
    error: unknown,
    expectedError: new () => Error,
    expectedMessage?: string
): void => {
    expect(error).toBeInstanceOf(expectedError);
    if (expectedMessage) {
        expect((error as Error).message).toContain(expectedMessage);
    }
};

/**
 * Mock para JwtAuthGuard
 */
export const mockJwtAuthGuard = () => ({
    canActivate: jest.fn().mockReturnValue(true),
});

/**
 * Mock para usuario autenticado en request
 */
export const mockAuthenticatedRequest = (userId = 'user-1'): { user: { userId: string } } => ({
    user: { userId },
});

/**
 * Constantes útiles para tests
 */
export const TestConstants = {
    TEST_USER_ID: 'test-user-id',
    TEST_CUSTOMER_ID: 'test-customer-id',
    TEST_PRODUCT_ID: 'test-product-id',
    TEST_SALE_ID: 'test-sale-id',
    TEST_PAYMENT_METHOD_ID: 'test-payment-method-id',
    DEFAULT_SALE_NUMBER: 'VENTA-2026-00001',
};

/**
 * Enumera todos los estados de venta
 */
export const AllSaleStatuses: SaleStatus[] = [
    SaleStatus.COMPLETED,
    SaleStatus.PENDING,
    SaleStatus.PARTIAL,
    SaleStatus.CANCELLED,
];

/**
 * Enumera todos los tipos de factura
 */
export const AllInvoiceTypes = [
    InvoiceType.FACTURA_A,
    InvoiceType.FACTURA_B,
    InvoiceType.FACTURA_C,
];

/**
 * Enumera todos los estados de factura
 */
export const AllInvoiceStatuses: InvoiceStatus[] = [
    InvoiceStatus.PENDING,
    InvoiceStatus.AUTHORIZED,
    InvoiceStatus.REJECTED,
    InvoiceStatus.ERROR,
];

/**
 * Helpers de fecha para tests
 */
export const DateTestHelpers = {
    /**
     * Crea una fecha en formato ISO (YYYY-MM-DD)
     */
    createDate: (year: number, month: number, day: number): string => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },

    /**
     * Crea una fecha con hora (YYYY-MM-DDTHH:mm:ss)
     */
    createDateTime: (year: number, month: number, day: number, hour = 0, minute = 0): string => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    },

    /**
     * Crea una fecha en el pasado
     */
    pastDate: (daysAgo: number): Date => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    },

    /**
     * Crea una fecha en el futuro
     */
    futureDate: (daysFromNow: number): Date => {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date;
    },

    /**
     * Formatea una fecha como YYYY-MM-DD
     */
    formatDate: (date: Date): string => {
        return date.toISOString().split('T')[0];
    },
};
