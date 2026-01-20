/**
 * Tests unitarios para SalesService (extensión de flujos críticos)
 * Cubre: ventas con caja abierta, ventas a cuenta corriente, validaciones de stock y pagos
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';

import { SalesService } from './sales.service';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { SaleTax } from './entities/sale-tax.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { InvoiceService } from './services/invoice.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomerAccountsService } from '../customer-accounts/customer-accounts.service';
import { AuditService } from '../audit/audit.service';
import { CreateSaleDto } from './dto';
import { createSaleDTO, createSaleItemDTO } from '../../test/factories';

const mockRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getOne: jest.fn().mockResolvedValue(null),
    })),
});

const mockCashRegisterService = {
    getOpenRegister: jest.fn(),
    registerIncome: jest.fn(),
    registerRefund: jest.fn(),
};

const mockProductsService = {
    findOne: jest.fn(),
};

const mockInventoryService = {
    createMovement: jest.fn(),
};

const mockInvoiceService = {
    generateInvoice: jest.fn(),
};

const mockCustomerAccountsService = {
    createCharge: jest.fn(),
    createAdjustment: jest.fn(),
};

const mockAuditService = {
    logSilent: jest.fn(),
};

describe('SalesService - critical flows', () => {
    let service: SalesService;

    // Estado encapsulado dentro del bloque describe para evitar interferencia entre tests
    let mockCompletedSaleForFindOne: unknown = null;
    const savedEntities = new Map<string, unknown[]>();
    let mockPaymentsForSale: unknown[] = [];

    // Crea un queryRunner limpio para cada test
    const createMockQueryRunner = () => ({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
            query: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockImplementation(async (entity: unknown) => {
                if (!entity) {
                    return { id: 'generated-id' };
                }
                const typedEntity = entity as Record<string, unknown>;
                const savedEntity = { ...typedEntity, id: typedEntity.id || `generated-${Date.now()}-${Math.random()}` };

                // Guardar payments en un array para poder recuperarlos después
                if (entity && typeof entity === 'object' && 'paymentMethodId' in entity && 'amount' in entity) {
                    const payments = savedEntities.get('payments') || [];
                    payments.push(savedEntity);
                    savedEntities.set('payments', payments);
                }

                return savedEntity;
            }),
            findOne: jest.fn().mockImplementation(async (_entity: unknown, options?: unknown) => {
                const typedOptions = options as { where?: { id?: string } } | undefined;
                if (typedOptions?.where?.id) {
                    const payments = mockPaymentsForSale.length > 0 ? mockPaymentsForSale : (savedEntities.get('payments') || []);
                    return {
                        ...(mockCompletedSaleForFindOne || {}),
                        payments: payments.length > 0 ? payments : [],
                    };
                }
                return mockCompletedSaleForFindOne;
            }),
            getRepository: jest.fn(() => mockRepository()),
        },
    });

    const mockDataSource = {
        createQueryRunner: jest.fn(createMockQueryRunner),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Resetear la variable de venta mock
        mockCompletedSaleForFindOne = null;
        // Limpiar entidades guardadas
        savedEntities.clear();
        // Limpiar payments manuales
        mockPaymentsForSale = [];
    });

    describe('validación de caja abierta', () => {
        it('debe bloquear venta si no hay caja abierta', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue(null);

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 100 }],
            };

            await expect(
                service.create(dto),
            ).rejects.toThrow(new BadRequestException('No hay caja abierta. Debe abrir la caja antes de registrar ventas.'));
        });

        it('debe permitir venta si hay caja abierta', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto Test'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)

            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            } as unknown;
            mockCompletedSaleForFindOne = mockCompletedSale;
            // Configurar payments que devolverá findOne
            mockPaymentsForSale = [
                { id: 'payment-1', paymentMethodId: 'pm-1', amount: 100, saleId: 'sale-1' },
            ];

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 100 }],
            };

            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
            expect(mockCashRegisterService.registerIncome).toHaveBeenCalled();
        });
    });

    describe('ventas a cuenta corriente', () => {
        it('debe crear venta a cuenta corriente y registrar cargo', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.PENDING,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;

            const dto: CreateSaleDto = {
                customerId: 'customer-1',
                isOnAccount: true,
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
            };

            await service.create(dto, 'user-1');

            expect(mockCustomerAccountsService.createCharge).toHaveBeenCalledWith(
                'customer-1',
                expect.objectContaining({
                    amount: 100,
                    description: expect.stringContaining('VENTA-'),
                }),
                'user-1',
            );
        });

        it('debe marcar venta como PENDING cuando es a cuenta corriente', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.PENDING,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;

            const dto: CreateSaleDto = {
                customerId: 'customer-1',
                isOnAccount: true,
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
            };

            const result = await service.create(dto, 'user-1');

            expect(result.status).toBe(SaleStatus.PENDING);
        });
    });

    describe('validación de stock', () => {
        it('debe validar stock suficiente antes de crear venta', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 5,
                sku: 'SKU1',
                name: 'Producto Test'
            });

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 10, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 1000 }],
            };

            await expect(service.create(dto)).rejects.toThrow(
                new BadRequestException('Stock insuficiente para "Producto Test". Disponible: 5, Solicitado: 10')
            );
        });

        it('debe lanzar error si producto no existe', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue(null);

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-inexistente', quantity: 1, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 100 }],
            };

            await expect(service.create(dto)).rejects.toThrow(
                new NotFoundException('Producto con ID product-inexistente no encontrado')
            );
        });

        it('debe crear movimiento de stock al completar venta', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                saleDate: new Date(),
                items: [
                    { id: 'item-1', productId: 'product-1', quantity: 2, unitPrice: 100, saleId: 'sale-1' },
                ],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;
            // Configurar payments que devolverá findOne
            mockPaymentsForSale = [
                { id: 'payment-1', paymentMethodId: 'pm-1', amount: 200, saleId: 'sale-1' },
            ];

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 2, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 200 }],
            };

            await service.create(dto, 'user-1');

            expect(mockInventoryService.createMovement).toHaveBeenCalledWith(
                expect.objectContaining({
                    productId: 'product-1',
                    quantity: 2,
                    type: 'OUT',
                })
            );
        });
    });

    describe('generación de comprobante', () => {
        it('debe generar número de venta único', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 100 }],
            };

            const result = await service.create(dto, 'user-1');

            expect(result.saleNumber).toMatch(/^VENTA-\d{4}-\d{5}$/);
        });

        it('debe generar factura si está configurado', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });
            mockInvoiceService.generateInvoice.mockResolvedValue({ id: 'invoice-1' });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: { id: 'invoice-1' },
            };
            mockCompletedSaleForFindOne = mockCompletedSale;

            const dto: CreateSaleDto = {
                generateInvoice: true,
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 100 }],
            };

            await service.create(dto, 'user-1');

            expect(mockInvoiceService.generateInvoice).toHaveBeenCalled();
        });
    });

    describe('efecto en caja', () => {
        it('debe registrar ingreso en caja por cada pago', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;
            // Configurar payments que devolverá findOne
            mockPaymentsForSale = [
                { id: 'payment-1', paymentMethodId: 'pm-1', amount: 60, saleId: 'sale-1' },
                { id: 'payment-2', paymentMethodId: 'pm-2', amount: 40, saleId: 'sale-1' },
            ];

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                payments: [
                    { paymentMethodId: 'pm-1', amount: 60 },
                    { paymentMethodId: 'pm-2', amount: 40 },
                ],
            };

            await service.create(dto, 'user-1');

            expect(mockCashRegisterService.registerIncome).toHaveBeenCalledTimes(2);
        });

        it('no debe registrar en caja si es venta a cuenta corriente', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.PENDING,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;

            const dto: CreateSaleDto = {
                isOnAccount: true,
                customerId: 'customer-1',
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
            };

            await service.create(dto, 'user-1');

            expect(mockCashRegisterService.registerIncome).not.toHaveBeenCalled();
        });
    });

    describe('validación de pagos', () => {
        it('debe validar que los pagos cubran el total', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 80 }], // Menor al total
            };

            await expect(service.create(dto)).rejects.toThrow(
                new BadRequestException('El total de pagos ($80.00) no coincide con el total de la venta ($100.00)')
            );
        });

        it('debe permitir tolerancia pequeña en diferencia de centavos', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 3, unitPrice: 100 }], // 300
                payments: [{ paymentMethodId: 'pm-1', amount: 300.01 }], // Diferencia de 0.01
            };

            // No debe lanzar error por diferencia de 0.01
            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
        });
    });

    describe('cálculos de totales', () => {
        it('debe calcular subtotal correctamente con descuentos por item', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto Test'
            });

            mockCompletedSaleForFindOne = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
                subtotal: 270,
                discount: 0,
                tax: 0,
                total: 270,
            };

            const dto: CreateSaleDto = {
                items: [
                    { productId: 'product-1', quantity: 2, unitPrice: 100, discount: 10 },
                    { productId: 'product-1', quantity: 1, unitPrice: 100, discount: 20 },
                ],
                payments: [{ paymentMethodId: 'pm-1', amount: 270 }],
            };

            const result = await service.create(dto, 'user-1');

            // Subtotal esperado: (200 - 10) + (100 - 20) = 190 + 80 = 270
            expect(result.subtotal).toBe(270);
        });

        it('debe calcular total con impuestos incluidos', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto Test'
            });

            mockCompletedSaleForFindOne = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
                subtotal: 100,
                discount: 0,
                tax: 21,
                total: 121,
            };

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                taxes: [{ name: 'IVA', amount: 21 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 121 }],
            };

            const result = await service.create(dto, 'user-1');

            // Subtotal: 100, TotalTax: 21, Total: 121
            expect(result.subtotal).toBe(100);
            expect(result.tax).toBe(21);
            expect(result.total).toBe(121);
        });

        it('debe calcular descuento global', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto Test'
            });

            mockCompletedSaleForFindOne = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
                subtotal: 200,
                discount: 30,
                tax: 0,
                total: 170,
            };

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 2, unitPrice: 100 }],
                discount: 30,
                payments: [{ paymentMethodId: 'pm-1', amount: 170 }],
            };

            const result = await service.create(dto, 'user-1');

            // Subtotal: 200, Discount: 30, Total: 170
            expect(result.subtotal).toBe(200);
            expect(result.discount).toBe(30);
            expect(result.total).toBe(170);
        });
    });

    describe('auditoría', () => {
        it('debe registrar auditoría al crear venta', async () => {
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockProductsService.findOne.mockResolvedValue({
                id: 'product-1',
                stock: 10,
                sku: 'SKU1',
                name: 'Producto'
            });

            // Usar el queryRunner compartido (el servicio usará el mismo)
            const mockCompletedSale = {
                id: 'sale-1',
                saleNumber: 'VENTA-2026-00001',
                status: SaleStatus.COMPLETED,
                items: [],
                payments: [],
                customer: null,
                createdBy: null,
                invoice: null,
            };
            mockCompletedSaleForFindOne = mockCompletedSale;

            const dto: CreateSaleDto = {
                items: [{ productId: 'product-1', quantity: 1, unitPrice: 100 }],
                payments: [{ paymentMethodId: 'pm-1', amount: 100 }],
            };

            await service.create(dto, 'user-1');

            expect(mockAuditService.logSilent).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityType: 'sale',
                    action: 'CREATE',
                    userId: 'user-1',
                })
            );
        });
    });
});

describe('SalesService - canCreateSale', () => {
    let service: SalesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe retornar true con razón cuando hay caja abierta', async () => {
        mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });

        const result = await service.canCreateSale();

        expect(result.canCreate).toBe(true);
        expect(result.reason).toBeUndefined();
    });

    it('debe retornar false con razón cuando no hay caja abierta', async () => {
        mockCashRegisterService.getOpenRegister.mockResolvedValue(null);

        const result = await service.canCreateSale();

        expect(result.canCreate).toBe(false);
        expect(result.reason).toContain('No hay caja abierta');
    });

    it('debe lanzar error cuando el servicio de caja falla', async () => {
        mockCashRegisterService.getOpenRegister.mockRejectedValue(new Error('Error de conexión'));

        await expect(service.canCreateSale()).rejects.toThrow('Error de conexión');
    });
});

describe('SalesService - findAll con filtros', () => {
    let service: SalesService;
    let mockQueryBuilder: unknown;

    beforeEach(async () => {
        // Mock query builder encadenable
        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        const mockSaleRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe retornar paginación vacía por defecto', async () => {
        const result = await service.findAll({});

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(0);
    });

    it('debe aplicar paginación correctamente', async () => {
        await service.findAll({ page: 2, limit: 20 });

        const qb = mockQueryBuilder as { skip: jest.Mock; take: jest.Mock };
        expect(qb.skip).toHaveBeenCalledWith(20);
        expect(qb.take).toHaveBeenCalledWith(20);
    });

    it('debe aplicar ordenamiento por defecto (saleNumber DESC)', async () => {
        await service.findAll({});

        const qb = mockQueryBuilder as { orderBy: jest.Mock };
        expect(qb.orderBy).toHaveBeenCalledWith('sale.saleNumber', 'DESC');
    });

    it('debe aplicar ordenamiento personalizado', async () => {
        await service.findAll({ sortBy: 'total', order: 'ASC' });

        const qb = mockQueryBuilder as { orderBy: jest.Mock };
        expect(qb.orderBy).toHaveBeenCalledWith('sale.total', 'ASC');
    });
});

describe('SalesService - findOne', () => {
    let service: SalesService;
    let mockSaleRepo: Repository<Sale>;

    beforeEach(async () => {
        mockSaleRepo = {
            findOne: jest.fn(),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe retornar venta con todas las relaciones', async () => {
        const mockSale = {
            id: 'sale-1',
            saleNumber: 'VENTA-2026-00001',
            status: SaleStatus.COMPLETED,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        const result = await service.findOne('sale-1');

        expect(result).toEqual(mockSale);
        expect(mockSaleRepo.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'sale-1' },
                relations: ['items', 'items.product', 'payments', 'payments.paymentMethod', 'customer', 'createdBy', 'invoice'],
            })
        );
    });

    it('debe lanzar NotFoundException si venta no existe', async () => {
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(null);

        await expect(service.findOne('nonexistent')).rejects.toThrow(
            new NotFoundException('Venta con ID nonexistent no encontrada')
        );
    });
});

describe('SalesService - update', () => {
    let service: SalesService;
    let mockSaleRepo: Repository<Sale>;

    beforeEach(async () => {
        mockSaleRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe actualizar campos permitidos', async () => {
        const mockSale = {
            id: 'sale-1',
            saleNumber: 'VENTA-2026-00001',
            status: SaleStatus.COMPLETED,
            inventoryUpdated: false,
            subtotal: 100,
            discount: 0,
            surcharge: 0,
            tax: 0,
            total: 100,
            customerId: null,
            customerName: null,
            notes: null,
            isOnAccount: false,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);
        (mockSaleRepo.save as jest.Mock).mockResolvedValue({ ...mockSale, notes: 'Nota actualizada' });

        const result = await service.update('sale-1', { notes: 'Nota actualizada' }, 'user-1');

        expect(mockAuditService.logSilent).toHaveBeenCalled();
    });

    it('debe bloquear si venta está cancelada', async () => {
        const mockSale = {
            id: 'sale-1',
            status: SaleStatus.CANCELLED,
            inventoryUpdated: false,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        await expect(
            service.update('sale-1', { notes: 'Nota' }, 'user-1')
        ).rejects.toThrow(new BadRequestException('No se puede modificar una venta cancelada'));
    });

    it('debe bloquear si inventario ya fue actualizado', async () => {
        const mockSale = {
            id: 'sale-1',
            status: SaleStatus.COMPLETED,
            inventoryUpdated: true,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        await expect(
            service.update('sale-1', { notes: 'Nota' }, 'user-1')
        ).rejects.toThrow(new BadRequestException('No se puede modificar una venta que ya actualizó el inventario'));
    });

    it('debe recalcular total al cambiar impuesto/descuento/recargo', async () => {
        const mockSale = {
            id: 'sale-1',
            saleNumber: 'VENTA-2026-00001',
            status: SaleStatus.COMPLETED,
            inventoryUpdated: false,
            subtotal: 100,
            discount: 0,
            surcharge: 0,
            tax: 0,
            total: 100,
            customerId: null,
            customerName: null,
            notes: null,
            isOnAccount: false,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);
        (mockSaleRepo.save as jest.Mock).mockImplementation((sale) => sale);

        const result = await service.update('sale-1', { tax: 21, discount: 10 }, 'user-1');

        expect(result.total).toBe(111); // 100 - 10 + 21
    });
});

describe('SalesService - cancel', () => {
    let service: SalesService;
    let mockSaleRepo: Repository<Sale>;

    const mockSaleWithPayments = {
        id: 'sale-1',
        saleNumber: 'VENTA-2026-00001',
        status: SaleStatus.COMPLETED,
        inventoryUpdated: true,
        total: 100,
        items: [],
        payments: [
            { paymentMethodId: 'pm-1', amount: 100, saleId: 'sale-1' },
        ],
        customer: null,
        createdBy: null,
        invoice: null,
        customerId: null,
        isOnAccount: false,
    };

    beforeEach(async () => {
        mockSaleRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe cancelar venta y cambiar estado', async () => {
        const freshSale = {
            ...mockSaleWithPayments,
            items: [{ id: 'item-1', productId: 'product-1', quantity: 1, unitPrice: 100, saleId: 'sale-1' }],
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(freshSale);
        (mockSaleRepo.save as jest.Mock).mockImplementation((sale) => sale);

        const result = await service.cancel('sale-1', 'user-1');

        expect(result.status).toBe(SaleStatus.CANCELLED);
        expect(mockInventoryService.createMovement).toHaveBeenCalled();
    });

    it('debe lanzar error si venta ya está cancelada', async () => {
        const mockCancelledSale = { ...mockSaleWithPayments, status: SaleStatus.CANCELLED };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockCancelledSale);

        await expect(service.cancel('sale-1', 'user-1')).rejects.toThrow(
            new BadRequestException('La venta ya está cancelada')
        );
    });

    it('debe revertir inventario si fue actualizado', async () => {
        const freshSale = {
            ...mockSaleWithPayments,
            items: [{ id: 'item-1', productId: 'product-1', quantity: 1, unitPrice: 100, saleId: 'sale-1' }],
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(freshSale);
        (mockSaleRepo.save as jest.Mock).mockImplementation((sale) => sale);

        await service.cancel('sale-1', 'user-1');

        expect(mockInventoryService.createMovement).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'IN',
                source: 'RETURN',
            })
        );
    });

    it('debe revertir cargo en cuenta corriente si aplica', async () => {
        const mockAccountSale = {
            ...mockSaleWithPayments,
            customerId: 'customer-1',
            isOnAccount: true,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockAccountSale);
        (mockSaleRepo.save as jest.Mock).mockImplementation((sale) => sale);

        await service.cancel('sale-1', 'user-1');

        expect(mockCustomerAccountsService.createAdjustment).toHaveBeenCalledWith(
            'customer-1',
            expect.objectContaining({
                amount: -100,
                description: expect.stringContaining('Anulación de venta'),
            }),
            'user-1',
        );
    });

    it('debe registrar devolución en caja para venta de contado', async () => {
        const freshSale = { ...mockSaleWithPayments };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(freshSale);
        (mockSaleRepo.save as jest.Mock).mockImplementation((sale) => sale);

        await service.cancel('sale-1', 'user-1');

        expect(mockCashRegisterService.registerRefund).toHaveBeenCalled();
    });
});

describe('SalesService - remove (soft delete)', () => {
    let service: SalesService;
    let mockSaleRepo: Repository<Sale>;

    beforeEach(async () => {
        mockSaleRepo = {
            findOne: jest.fn(),
            softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe eliminar venta (soft delete)', async () => {
        const mockSale = {
            id: 'sale-1',
            inventoryUpdated: false,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        const result = await service.remove('sale-1', 'user-1');

        expect(result).toEqual({ message: 'Venta eliminada' });
        expect(mockSaleRepo.softDelete).toHaveBeenCalledWith('sale-1');
        expect(mockAuditService.logSilent).toHaveBeenCalled();
    });

    it('debe bloquear si inventario ya fue actualizado', async () => {
        const mockSale = {
            id: 'sale-1',
            inventoryUpdated: true,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        await expect(service.remove('sale-1', 'user-1')).rejects.toThrow(
            new BadRequestException('No se puede eliminar una venta que ya actualizó el inventario. Cancélela primero.')
        );
    });
});

describe('SalesService - markAsPaid', () => {
    let service: SalesService;
    let savedEntities: unknown[] = [];
    let mockQueryRunner: QueryRunner;
    let mockSaleRepo: Repository<Sale>;

    const createMockQueryRunnerForMarkAsPaid = () => ({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
            query: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockImplementation(async (entity) => {
                if (!entity) {
                    return { id: 'generated-id' };
                }
                const typed = entity as Record<string, unknown>;
                const savedEntity = { ...typed, id: typed.id || `generated-${Date.now()}` };
                savedEntities.push(savedEntity);
                return savedEntity;
            }),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            findOne: jest.fn().mockResolvedValue({
                id: 'sale-1',
                status: SaleStatus.PENDING,
                inventoryUpdated: false,
                items: [],
                payments: [],
            }),
            getRepository: jest.fn(() => mockRepository()),
        },
    });

    const mockDataSource = {
        createQueryRunner: jest.fn(createMockQueryRunnerForMarkAsPaid),
    };

    beforeEach(async () => {
        savedEntities = [];
        mockQueryRunner = createMockQueryRunnerForMarkAsPaid() as unknown as QueryRunner;

        mockSaleRepo = {
            findOne: jest.fn(),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        savedEntities = [];
    });

    it('debe marcar venta PENDING como COMPLETED', async () => {
        const mockSale = {
            id: 'sale-1',
            saleNumber: 'VENTA-2026-00001',
            status: SaleStatus.PENDING,
            isOnAccount: true,
            inventoryUpdated: false,
            customerId: 'customer-1',
            customerName: 'Cliente CC',
            items: [],
            payments: [],
            customer: null,
            createdBy: null,
            invoice: null,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });

        const payments = [{ paymentMethodId: 'pm-1', amount: 100 }];

        const result = await service.markAsPaid('sale-1', payments, 'user-1');

        expect(result.status).toBe(SaleStatus.COMPLETED);
        expect(result.isOnAccount).toBe(false);
        expect(mockCashRegisterService.registerIncome).toHaveBeenCalled();
        expect(mockAuditService.logSilent).toHaveBeenCalled();
    });

    it('debe lanzar error si venta está cancelada', async () => {
        const mockSale = {
            id: 'sale-1',
            status: SaleStatus.CANCELLED,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        await expect(
            service.markAsPaid('sale-1', [{ paymentMethodId: 'pm-1', amount: 100 }], 'user-1')
        ).rejects.toThrow(new BadRequestException('No se puede pagar una venta cancelada'));
    });

    it('debe lanzar error si venta ya está completada', async () => {
        const mockSale = {
            id: 'sale-1',
            status: SaleStatus.COMPLETED,
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        await expect(
            service.markAsPaid('sale-1', [{ paymentMethodId: 'pm-1', amount: 100 }], 'user-1')
        ).rejects.toThrow(new BadRequestException('La venta ya está completada'));
    });

    it('debe actualizar inventario si no estaba actualizado', async () => {
        const mockSale = {
            id: 'sale-1',
            status: SaleStatus.PENDING,
            isOnAccount: true,
            inventoryUpdated: false,
            items: [{ productId: 'product-1', quantity: 1, unitPrice: 100, saleId: 'sale-1' }],
            payments: [],
        };
        (mockSaleRepo.findOne as jest.Mock).mockResolvedValue(mockSale);

        mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });

        const result = await service.markAsPaid('sale-1', [{ paymentMethodId: 'pm-1', amount: 100 }], 'user-1');

        // La venta se marca como completada
        expect(result.status).toBe(SaleStatus.COMPLETED);
        expect(result.isOnAccount).toBe(false);
    });
});

describe('SalesService - getTodaySales', () => {
    let service: SalesService;
    let mockQueryBuilder: unknown;

    beforeEach(async () => {
        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };

        const mockSaleRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe retornar ventas del día actual', async () => {
        await service.getTodaySales();

        const qb = mockQueryBuilder as { where: jest.Mock };
        expect(qb.where).toHaveBeenCalled();
    });

    it('debe incluir relaciones correctas', async () => {
        await service.getTodaySales();

        const qb = mockQueryBuilder as { leftJoinAndSelect: jest.Mock };
        expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('sale.items', 'items');
        expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('sale.payments', 'payments');
        expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('sale.customer', 'customer');
    });
});

describe('SalesService - getStats', () => {
    let service: SalesService;
    let mockQueryBuilder: unknown;

    beforeEach(async () => {
        mockQueryBuilder = {
            leftJoin: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([
                {
                    id: 'sale-1',
                    status: SaleStatus.COMPLETED,
                    total: 100,
                    payments: [{ paymentMethod: { name: 'Efectivo' }, amount: 50 }],
                },
                {
                    id: 'sale-2',
                    status: SaleStatus.PENDING,
                    total: 50,
                    payments: [],
                },
                {
                    id: 'sale-3',
                    status: SaleStatus.CANCELLED,
                    total: 75,
                    payments: [],
                },
            ]),
        };

        const mockSaleRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        } as unknown as Repository<Sale>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepo },
                { provide: getRepositoryToken(SaleItem), useFactory: mockRepository },
                { provide: getRepositoryToken(SalePayment), useFactory: mockRepository },
                { provide: getRepositoryToken(SaleTax), useFactory: mockRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: InvoiceService, useValue: mockInvoiceService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: getDataSourceToken(), useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe calcular estadísticas correctamente', async () => {
        const result = await service.getStats();

        expect(result.totalSales).toBe(3);
        expect(result.totalAmount).toBe(150); // Excluye cancelled
        expect(result.totalCompleted).toBe(100);
        expect(result.totalPending).toBe(50);
    });

    it('debe contar ventas por estado', async () => {
        const result = await service.getStats();

        expect(result.salesByStatus).toEqual({
            [SaleStatus.COMPLETED]: 1,
            [SaleStatus.PENDING]: 1,
            [SaleStatus.PARTIAL]: 0,
            [SaleStatus.CANCELLED]: 1,
        });
    });

    it('debe agrupar por método de pago', async () => {
        const result = await service.getStats();

        expect(result.salesByPaymentMethod).toEqual({
            'Efectivo': 50,
        });
    });
});
