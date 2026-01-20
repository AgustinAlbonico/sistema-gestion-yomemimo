/**
 * Tests unitarios para CustomerAccountsController
 * Cubre: todos los endpoints REST del controlador
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerAccountsController } from './customer-accounts.controller';
import { CustomerAccountsService } from './customer-accounts.service';
import { CreateChargeDto, CreatePaymentDto, UpdateAccountDto, AccountFiltersDto } from './dto';
import { ApplySurchargeDto, SurchargeType } from './dto/apply-surcharge.dto';
import { AuthenticatedRequest } from '../auth/types';
import { AccountStatus } from './entities/customer-account.entity';

// Mock del servicio
const mockCustomerAccountsService = {
    findAll: jest.fn(),
    getStats: jest.fn(),
    getDebtors: jest.fn(),
    getOverdueAlerts: jest.fn(),
    getPendingTransactions: jest.fn(),
    getAccountStatement: jest.fn(),
    createCharge: jest.fn(),
    createPayment: jest.fn(),
    applySurcharge: jest.fn(),
    updateAccount: jest.fn(),
    suspendAccount: jest.fn(),
    activateAccount: jest.fn(),
    syncMissingCharges: jest.fn(),
};

// Mock del guard
const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
};

describe('CustomerAccountsController', () => {
    let controller: CustomerAccountsController;
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            controllers: [CustomerAccountsController],
            providers: [
                {
                    provide: CustomerAccountsService,
                    useValue: mockCustomerAccountsService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(mockJwtAuthGuard)
            .compile();

        controller = module.get<CustomerAccountsController>(CustomerAccountsController);
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('findAll', () => {
        it('debe retornar lista de cuentas con filtros', async () => {
            const mockAccounts = {
                data: [
                    {
                        id: 'account-1',
                        customerId: 'customer-1',
                        balance: 1500,
                        customer: { firstName: 'Juan', lastName: 'Pérez' },
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
            };

            const filters: AccountFiltersDto = {
                page: 1,
                limit: 10,
                status: undefined,
                hasDebt: undefined,
                isOverdue: undefined,
                search: undefined,
            };

            mockCustomerAccountsService.findAll.mockResolvedValue(mockAccounts);

            const result = await controller.findAll(filters);

            expect(result).toEqual(mockAccounts);
            expect(mockCustomerAccountsService.findAll).toHaveBeenCalledWith(filters);
        });

        it('debe filtrar por estado', async () => {
            const mockAccounts = {
                data: [
                    {
                        id: 'account-1',
                        status: 'ACTIVE' as const,
                        balance: 0,
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
            };

            const filters: AccountFiltersDto = {
                page: 1,
                limit: 10,
                status: AccountStatus.ACTIVE,
            };

            mockCustomerAccountsService.findAll.mockResolvedValue(mockAccounts);

            const result = await controller.findAll(filters);

            expect(result.data[0].status).toBe('ACTIVE');
            expect(mockCustomerAccountsService.findAll).toHaveBeenCalledWith(filters);
        });
    });

    describe('getStats', () => {
        it('debe retornar estadísticas globales', async () => {
            const mockStats = {
                totalAccounts: 150,
                activeAccounts: 120,
                suspendedAccounts: 10,
                totalDebt: 450000,
                averageDebt: 3000,
                overdueAccounts: 25,
                overdueAmount: 85000,
            };

            mockCustomerAccountsService.getStats.mockResolvedValue(mockStats);

            const result = await controller.getStats();

            expect(result).toEqual(mockStats);
            expect(mockCustomerAccountsService.getStats).toHaveBeenCalled();
        });

        it('debe manejar caso sin datos', async () => {
            const mockStats = {
                totalAccounts: 0,
                activeAccounts: 0,
                suspendedAccounts: 0,
                totalDebt: 0,
                averageDebt: 0,
                overdueAccounts: 0,
                overdueAmount: 0,
            };

            mockCustomerAccountsService.getStats.mockResolvedValue(mockStats);

            const result = await controller.getStats();

            expect(result.totalAccounts).toBe(0);
            expect(result.averageDebt).toBe(0);
        });
    });

    describe('getDebtors', () => {
        it('debe retornar lista de deudores', async () => {
            const mockDebtors = [
                {
                    customerId: 'customer-1',
                    customerName: 'Juan Pérez',
                    balance: 5000,
                    daysOverdue: 15,
                    status: 'ACTIVE' as const,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'María García',
                    balance: 3200,
                    daysOverdue: 5,
                    status: 'ACTIVE' as const,
                },
            ];

            mockCustomerAccountsService.getDebtors.mockResolvedValue(mockDebtors);

            const result = await controller.getDebtors();

            expect(result).toEqual(mockDebtors);
            expect(result).toHaveLength(2);
            expect(mockCustomerAccountsService.getDebtors).toHaveBeenCalled();
        });

        it('debe retornar array vacío si no hay deudores', async () => {
            mockCustomerAccountsService.getDebtors.mockResolvedValue([]);

            const result = await controller.getDebtors();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });
    });

    describe('getOverdueAlerts', () => {
        it('debe retornar alertas de deudores morosos', async () => {
            const mockAlerts = [
                {
                    customerId: 'customer-1',
                    customerName: 'Juan Pérez',
                    balance: 5000,
                    daysOverdue: 45,
                    lastPaymentDate: '2024-11-01',
                },
                {
                    customerId: 'customer-2',
                    customerName: 'María García',
                    balance: 3200,
                    daysOverdue: 30,
                    lastPaymentDate: '2024-11-15',
                },
            ];

            mockCustomerAccountsService.getOverdueAlerts.mockResolvedValue(mockAlerts);

            const result = await controller.getOverdueAlerts();

            expect(result).toEqual(mockAlerts);
            expect(result).toHaveLength(2);
            expect(mockCustomerAccountsService.getOverdueAlerts).toHaveBeenCalled();
        });

        it('debe retornar array vacío si no hay morosos', async () => {
            mockCustomerAccountsService.getOverdueAlerts.mockResolvedValue([]);

            const result = await controller.getOverdueAlerts();

            expect(result).toEqual([]);
        });
    });

    describe('getPendingTransactions', () => {
        it('debe retornar transacciones pendientes del cliente', async () => {
            const mockTransactions = {
                sales: [
                    {
                        id: 'sale-1',
                        saleNumber: 'S001',
                        total: 1500,
                        saleDate: new Date('2024-12-01'),
                    },
                ],
                incomes: [
                    {
                        id: 'income-1',
                        amount: 500,
                        date: new Date('2024-12-02'),
                    },
                ],
            };

            mockCustomerAccountsService.getPendingTransactions.mockResolvedValue(mockTransactions);

            const result = await controller.getPendingTransactions('customer-1');

            expect(result).toEqual(mockTransactions);
            expect(mockCustomerAccountsService.getPendingTransactions).toHaveBeenCalledWith('customer-1');
        });

        it('debe retornar vacío si no hay transacciones pendientes', async () => {
            const mockTransactions = {
                sales: [],
                incomes: [],
            };

            mockCustomerAccountsService.getPendingTransactions.mockResolvedValue(mockTransactions);

            const result = await controller.getPendingTransactions('customer-1');

            expect(result.sales).toHaveLength(0);
            expect(result.incomes).toHaveLength(0);
        });
    });

    describe('getAccountStatement', () => {
        it('debe retornar estado de cuenta con valores por defecto', async () => {
            const mockStatement = {
                account: {
                    id: 'account-1',
                    customerId: 'customer-1',
                    balance: 5000,
                },
                movements: {
                    data: [],
                    total: 0,
                    page: 1,
                    limit: 50,
                },
                customerPosition: {
                    totalCharges: 10000,
                    totalPayments: 5000,
                    balance: 5000,
                },
            };

            mockCustomerAccountsService.getAccountStatement.mockResolvedValue(mockStatement);

            const result = await controller.getAccountStatement('customer-1');

            expect(result).toEqual(mockStatement);
            expect(mockCustomerAccountsService.getAccountStatement).toHaveBeenCalledWith('customer-1', 1, 50);
        });

        it('debe usar page y limit proporcionados', async () => {
            const mockStatement = {
                account: { id: 'account-1', balance: 5000 },
                movements: { data: [], total: 0, page: 2, limit: 25 },
                customerPosition: { totalCharges: 10000, totalPayments: 5000, balance: 5000 },
            };

            mockCustomerAccountsService.getAccountStatement.mockResolvedValue(mockStatement);

            await controller.getAccountStatement('customer-1', 2, 25);

            expect(mockCustomerAccountsService.getAccountStatement).toHaveBeenCalledWith('customer-1', 2, 25);
        });

        it('debe limitar el valor máximo a 100', async () => {
            const mockStatement = {
                account: { id: 'account-1', balance: 5000 },
                movements: { data: [], total: 0, page: 1, limit: 100 },
                customerPosition: { totalCharges: 10000, totalPayments: 5000, balance: 5000 },
            };

            mockCustomerAccountsService.getAccountStatement.mockResolvedValue(mockStatement);

            await controller.getAccountStatement('customer-1', 1, 150);

            expect(mockCustomerAccountsService.getAccountStatement).toHaveBeenCalledWith('customer-1', 1, 100);
        });

        it('debe usar valores por defecto para page <= 0', async () => {
            const mockStatement = {
                account: { id: 'account-1', balance: 5000 },
                movements: { data: [], total: 0, page: 1, limit: 50 },
                customerPosition: { totalCharges: 10000, totalPayments: 5000, balance: 5000 },
            };

            mockCustomerAccountsService.getAccountStatement.mockResolvedValue(mockStatement);

            await controller.getAccountStatement('customer-1', 0, 50);

            expect(mockCustomerAccountsService.getAccountStatement).toHaveBeenCalledWith('customer-1', 1, 50);
        });
    });

    describe('createCharge', () => {
        it('debe crear un cargo', async () => {
            const dto: CreateChargeDto = {
                amount: 1500,
                description: 'Venta #001',
            };

            const mockCharge = {
                id: 'movement-1',
                amount: 1500,
                balanceAfter: 1500,
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.createCharge.mockResolvedValue(mockCharge);

            const result = await controller.createCharge('customer-1', dto, mockRequest as AuthenticatedRequest);

            expect(result).toEqual(mockCharge);
            expect(mockCustomerAccountsService.createCharge).toHaveBeenCalledWith('customer-1', dto, 'user-1');
        });

        it('debe incluir saleId si está presente', async () => {
            const dto: CreateChargeDto = {
                amount: 2000,
                description: 'Venta #002',
                saleId: 'sale-1',
            };

            const mockCharge = {
                id: 'movement-1',
                amount: 2000,
                balanceAfter: 2000,
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.createCharge.mockResolvedValue(mockCharge);

            await controller.createCharge('customer-1', dto, mockRequest as AuthenticatedRequest);

            expect(mockCustomerAccountsService.createCharge).toHaveBeenCalledWith(
                'customer-1',
                dto,
                'user-1',
            );
        });

        it('debe manejar usuario no autenticado', async () => {
            const dto: CreateChargeDto = {
                amount: 1500,
                description: 'Venta #001',
            };

            const mockCharge = {
                id: 'movement-1',
                amount: 1500,
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: undefined,
            };

            mockCustomerAccountsService.createCharge.mockResolvedValue(mockCharge);

            await controller.createCharge('customer-1', dto, mockRequest as AuthenticatedRequest);

            expect(mockCustomerAccountsService.createCharge).toHaveBeenCalledWith('customer-1', dto, undefined);
        });
    });

    describe('createPayment', () => {
        it('debe crear un pago', async () => {
            const dto: CreatePaymentDto = {
                amount: 1000,
                paymentMethodId: 'method-1',
                description: 'Pago parcial',
            };

            const mockPayment = {
                id: 'movement-1',
                amount: -1000,
                balanceAfter: 500,
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.createPayment.mockResolvedValue(mockPayment);

            const result = await controller.createPayment('customer-1', dto, mockRequest as AuthenticatedRequest);

            expect(result).toEqual(mockPayment);
            expect(mockCustomerAccountsService.createPayment).toHaveBeenCalledWith('customer-1', dto, 'user-1');
        });

        it('debe crear pago sin descripción', async () => {
            const dto: CreatePaymentDto = {
                amount: 500,
                paymentMethodId: 'method-1',
            };

            const mockPayment = {
                id: 'movement-1',
                amount: -500,
                balanceAfter: 0,
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.createPayment.mockResolvedValue(mockPayment);

            await controller.createPayment('customer-1', dto, mockRequest as AuthenticatedRequest);

            expect(mockCustomerAccountsService.createPayment).toHaveBeenCalledWith('customer-1', dto, 'user-1');
        });
    });

    describe('applySurcharge', () => {
        it('debe aplicar recargo porcentual', async () => {
            const dto: ApplySurchargeDto = {
                surchargeType: SurchargeType.PERCENTAGE,
                value: 5,
                description: 'Recargo por mora',
            };

            const mockSurcharge = {
                id: 'movement-1',
                amount: 250,
                balanceAfter: 5250,
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.applySurcharge.mockResolvedValue(mockSurcharge);

            const result = await controller.applySurcharge('customer-1', dto, mockRequest as AuthenticatedRequest);

            expect(result).toEqual(mockSurcharge);
            expect(mockCustomerAccountsService.applySurcharge).toHaveBeenCalledWith('customer-1', dto, 'user-1');
        });

        it('debe aplicar recargo fijo', async () => {
            const dto: ApplySurchargeDto = {
                surchargeType: SurchargeType.FIXED,
                value: 100,
            };

            const mockSurcharge = {
                id: 'movement-1',
                amount: 100,
                balanceAfter: 5100,
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.applySurcharge.mockResolvedValue(mockSurcharge);

            await controller.applySurcharge('customer-1', dto, mockRequest as AuthenticatedRequest);

            expect(mockCustomerAccountsService.applySurcharge).toHaveBeenCalledWith('customer-1', dto, 'user-1');
        });
    });

    describe('updateAccount', () => {
        it('debe actualizar límite de crédito', async () => {
            const dto: UpdateAccountDto = {
                creditLimit: 50000,
            };

            const mockUpdated = {
                id: 'account-1',
                creditLimit: 50000,
            };

            mockCustomerAccountsService.updateAccount.mockResolvedValue(mockUpdated);

            const result = await controller.updateAccount('customer-1', dto);

            expect(result).toEqual(mockUpdated);
            expect(mockCustomerAccountsService.updateAccount).toHaveBeenCalledWith('customer-1', dto);
        });

        it('debe actualizar estado de cuenta', async () => {
            const dto: UpdateAccountDto = {
                status: AccountStatus.SUSPENDED,
            };

            const mockUpdated = {
                id: 'account-1',
                status: AccountStatus.SUSPENDED,
            };

            mockCustomerAccountsService.updateAccount.mockResolvedValue(mockUpdated);

            const result = await controller.updateAccount('customer-1', dto);

            expect(result.status).toBe(AccountStatus.SUSPENDED);
        });

        it('debe actualizar ambos límite y estado', async () => {
            const dto: UpdateAccountDto = {
                creditLimit: 30000,
                status: AccountStatus.ACTIVE,
            };

            const mockUpdated = {
                id: 'account-1',
                creditLimit: 30000,
                status: AccountStatus.ACTIVE,
            };

            mockCustomerAccountsService.updateAccount.mockResolvedValue(mockUpdated);

            await controller.updateAccount('customer-1', dto);

            expect(mockCustomerAccountsService.updateAccount).toHaveBeenCalledWith('customer-1', dto);
        });
    });

    describe('suspendAccount', () => {
        it('debe suspender cuenta activa', async () => {
            const mockSuspended = {
                id: 'account-1',
                status: 'SUSPENDED',
            };

            mockCustomerAccountsService.suspendAccount.mockResolvedValue(mockSuspended);

            const result = await controller.suspendAccount('customer-1');

            expect(result).toEqual(mockSuspended);
            expect(result.status).toBe('SUSPENDED');
            expect(mockCustomerAccountsService.suspendAccount).toHaveBeenCalledWith('customer-1');
        });
    });

    describe('activateAccount', () => {
        it('debe activar cuenta suspendida', async () => {
            const mockActivated = {
                id: 'account-1',
                status: 'ACTIVE',
            };

            mockCustomerAccountsService.activateAccount.mockResolvedValue(mockActivated);

            const result = await controller.activateAccount('customer-1');

            expect(result).toEqual(mockActivated);
            expect(result.status).toBe('ACTIVE');
            expect(mockCustomerAccountsService.activateAccount).toHaveBeenCalledWith('customer-1');
        });
    });

    describe('syncMissingCharges', () => {
        it('debe sincronizar cargos faltantes', async () => {
            const mockResult = {
                chargesCreated: 2,
                totalAmount: 3500,
                sales: [
                    { saleId: 'sale-1', saleNumber: 'S001', amount: 1500 },
                    { saleId: 'sale-2', saleNumber: 'S002', amount: 2000 },
                ],
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.syncMissingCharges.mockResolvedValue(mockResult);

            const result = await controller.syncMissingCharges('customer-1', mockRequest as AuthenticatedRequest);

            expect(result).toEqual(mockResult);
            expect(result.chargesCreated).toBe(2);
            expect(result.totalAmount).toBe(3500);
            expect(mockCustomerAccountsService.syncMissingCharges).toHaveBeenCalledWith('customer-1', 'user-1');
        });

        it('debe retornar vacío si no hay cargos faltantes', async () => {
            const mockResult = {
                chargesCreated: 0,
                totalAmount: 0,
                sales: [],
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: { userId: 'user-1', username: 'admin' },
            };

            mockCustomerAccountsService.syncMissingCharges.mockResolvedValue(mockResult);

            const result = await controller.syncMissingCharges('customer-1', mockRequest as AuthenticatedRequest);

            expect(result.chargesCreated).toBe(0);
            expect(result.sales).toHaveLength(0);
        });

        it('debe manejar usuario no autenticado', async () => {
            const mockResult = {
                chargesCreated: 1,
                totalAmount: 1000,
                sales: [{ saleId: 'sale-1', saleNumber: 'S001', amount: 1000 }],
            };

            const mockRequest: Partial<AuthenticatedRequest> = {
                user: undefined,
            };

            mockCustomerAccountsService.syncMissingCharges.mockResolvedValue(mockResult);

            await controller.syncMissingCharges('customer-1', mockRequest as AuthenticatedRequest);

            expect(mockCustomerAccountsService.syncMissingCharges).toHaveBeenCalledWith('customer-1', undefined);
        });
    });
});
