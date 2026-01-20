/**
 * Tests para SalesController
 * Prueba los endpoints del controlador de ventas
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSaleDto, UpdateSaleDto, SaleFiltersDto } from './dto';
import { AuthenticatedRequest } from '../auth/interfaces';

describe('SalesController', () => {
    let controller: SalesController;
    let salesService: any;

    // Mock de AuthenticatedRequest
    const mockRequest = {
        user: { userId: 'test-user-id' },
    } as unknown as AuthenticatedRequest;

    // Mock DTOs
    const mockCreateSaleDto: CreateSaleDto = {
        customerId: 'customer-123',
        items: [
            {
                productId: 'product-123',
                quantity: 2,
                unitPrice: 100,
            },
        ],
        payments: [
            {
                paymentMethodId: 'payment-method-123',
                amount: 200,
            },
        ],
    };

    const mockUpdateSaleDto: UpdateSaleDto = {
        notes: 'Updated notes',
    };

    const mockSaleFilters: SaleFiltersDto = {
        page: 1,
        limit: 10,
    };

    const mockPayments = [
        { paymentMethodId: 'pm-123', amount: 100 },
    ];

    beforeEach(async () => {
        const mockSalesService: any = {
            create: jest.fn(),
            findAll: jest.fn(),
            getStats: jest.fn(),
            canCreateSale: jest.fn(),
            getTodaySales: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn(),
            markAsPaid: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SalesController],
            providers: [
                {
                    provide: SalesService,
                    useValue: mockSalesService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<SalesController>(SalesController);
        salesService = mockSalesService;
    });

    it('debería estar definido', () => {
        expect(controller).toBeDefined();
    });

    describe('POST /', () => {
        it('debería crear una venta', async () => {
            const mockSale = { id: 'sale-123', ...mockCreateSaleDto };
            salesService.create.mockResolvedValue(mockSale as any);

            const result = await controller.create(mockCreateSaleDto, mockRequest);

            expect(salesService.create).toHaveBeenCalledWith(
                mockCreateSaleDto,
                'test-user-id'
            );
            expect(result).toEqual(mockSale);
        });
    });

    describe('GET /', () => {
        it('debería retornar ventas paginadas', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };
            salesService.findAll.mockResolvedValue(mockResult);

            const result = await controller.findAll(mockSaleFilters);

            expect(salesService.findAll).toHaveBeenCalledWith(mockSaleFilters);
            expect(result).toEqual(mockResult);
        });
    });

    describe('GET /stats', () => {
        it('debería retornar estadísticas de ventas', async () => {
            const mockStats = {
                totalSales: 10,
                totalAmount: 5000,
                totalCompleted: 8,
                totalPending: 2,
            };
            salesService.getStats.mockResolvedValue(mockStats as any);

            const result = await controller.getStats('2024-01-01', '2024-12-31');

            expect(salesService.getStats).toHaveBeenCalledWith(
                '2024-01-01',
                '2024-12-31'
            );
            expect(result).toEqual(mockStats);
        });

        it('debería funcionar sin parámetros de fecha', async () => {
            const mockStats = { totalSales: 0 };
            salesService.getStats.mockResolvedValue(mockStats as any);

            await controller.getStats();

            expect(salesService.getStats).toHaveBeenCalledWith(
                undefined,
                undefined
            );
        });
    });

    describe('GET /can-create', () => {
        it('debería retornar estado de creación de venta', async () => {
            const mockResponse = { canCreate: true };
            salesService.canCreateSale.mockResolvedValue(mockResponse as any);

            const result = await controller.canCreate();

            expect(salesService.canCreateSale).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });

        it('debería retornar razón cuando no se puede crear', async () => {
            const mockResponse = { canCreate: false, reason: 'Caja cerrada' };
            salesService.canCreateSale.mockResolvedValue(mockResponse as any);

            const result = await controller.canCreate();

            expect(result.canCreate).toBe(false);
            expect(result.reason).toBe('Caja cerrada');
        });
    });

    describe('GET /today', () => {
        it('debería retornar ventas del día actual', async () => {
            const mockTodaySales: any[] = [];
            salesService.getTodaySales.mockResolvedValue(mockTodaySales);

            const result = await controller.getTodaySales();

            expect(salesService.getTodaySales).toHaveBeenCalled();
            expect(result).toEqual(mockTodaySales);
        });
    });

    describe('GET /:id', () => {
        it('debería retornar una venta por ID', async () => {
            const mockSale = { id: 'sale-123' };
            salesService.findOne.mockResolvedValue(mockSale as any);

            const result = await controller.findOne('sale-123');

            expect(salesService.findOne).toHaveBeenCalledWith('sale-123');
            expect(result).toEqual(mockSale);
        });
    });

    describe('PATCH /:id', () => {
        it('debería actualizar una venta', async () => {
            const mockSale = { id: 'sale-123', notes: 'Updated' };
            salesService.update.mockResolvedValue(mockSale as any);

            const result = await controller.update(
                'sale-123',
                mockUpdateSaleDto,
                mockRequest
            );

            expect(salesService.update).toHaveBeenCalledWith(
                'sale-123',
                mockUpdateSaleDto,
                'test-user-id'
            );
            expect(result).toEqual(mockSale);
        });
    });

    describe('PATCH /:id/cancel', () => {
        it('debería cancelar una venta', async () => {
            const mockSale = { id: 'sale-123', status: 'CANCELLED' };
            salesService.cancel.mockResolvedValue(mockSale as any);

            const result = await controller.cancel('sale-123', mockRequest);

            expect(salesService.cancel).toHaveBeenCalledWith(
                'sale-123',
                'test-user-id'
            );
            expect(result).toEqual(mockSale);
        });
    });

    describe('PATCH /:id/pay', () => {
        it('debería marcar venta como pagada', async () => {
            const mockPayments = [
                { paymentMethodId: 'pm-123', amount: 100 },
            ];
            const mockSale = { id: 'sale-123', status: 'COMPLETED' };
            salesService.markAsPaid.mockResolvedValue(mockSale as any);

            const result = await controller.markAsPaid(
                'sale-123',
                { payments: mockPayments },
                mockRequest
            );

            expect(salesService.markAsPaid).toHaveBeenCalledWith(
                'sale-123',
                mockPayments,
                'test-user-id'
            );
            expect(result).toEqual(mockSale);
        });

        it('debería manejar payments undefined o vacío', async () => {
            const mockSale = { id: 'sale-123', status: 'COMPLETED' };
            salesService.markAsPaid.mockResolvedValue(mockSale as any);

            const body = { payments: undefined as unknown as typeof mockPayments };
            await controller.markAsPaid('sale-123', body, mockRequest);

            expect(salesService.markAsPaid).toHaveBeenCalledWith(
                'sale-123',
                [],
                'test-user-id'
            );
        });
    });

    describe('DELETE /:id', () => {
        it('debería eliminar una venta (soft delete)', async () => {
            const mockSale = { id: 'sale-123', deletedAt: new Date() };
            salesService.remove.mockResolvedValue(mockSale as any);

            const result = await controller.remove('sale-123', mockRequest);

            expect(salesService.remove).toHaveBeenCalledWith(
                'sale-123',
                'test-user-id'
            );
            expect(result).toEqual(mockSale);
        });
    });
});
