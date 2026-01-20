/**
 * Tests unitarios para CustomerAccountsService
 * Cubre: getOrCreateAccount, findAll, getDebtors, getStats, updateAccount, suspendAccount, activateAccount
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';

import { CustomerAccountsService } from './customer-accounts.service';
import { CustomerAccount, AccountStatus } from './entities/customer-account.entity';
import { AccountMovement, MovementType } from './entities/account-movement.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Income } from '../incomes/entities/income.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomersService } from '../customers/customers.service';
import { createChargeDTO, createPaymentDTO } from '../../test/factories';

// Mocks estáticos fuera de los describe para evitar recreación
const mockAccountRepository = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockMovementRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockSaleRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockIncomeRepository = {
    find: jest.fn(),
};

const mockCustomersService = {
    findOne: jest.fn(),
};

const mockCashRegisterService = {
    registerAccountPayment: jest.fn(),
};

const mockDataSource = {
    transaction: jest.fn(),
    query: jest.fn(),
};

// Helper para crear un query builder mock
const createMockQueryBuilder = () => ({
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    execute: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
});

describe('CustomerAccountsService', () => {
    let service: CustomerAccountsService;
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                CustomerAccountsService,
                { provide: getRepositoryToken(CustomerAccount), useValue: mockAccountRepository },
                { provide: getRepositoryToken(AccountMovement), useValue: mockMovementRepository },
                { provide: getRepositoryToken(Sale), useValue: mockSaleRepository },
                { provide: getRepositoryToken(Income), useValue: mockIncomeRepository },
                { provide: CustomersService, useValue: mockCustomersService },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: getDataSourceToken(), useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<CustomerAccountsService>(CustomerAccountsService);
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

    describe('getOrCreateAccount', () => {
        it('debe retornar cuenta existente', async () => {
            const existingAccount = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 500,
                status: AccountStatus.ACTIVE,
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            mockAccountRepository.findOne.mockResolvedValue(existingAccount);

            const result = await service.getOrCreateAccount('customer-1');

            expect(result).toEqual(existingAccount);
            expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
                where: { customerId: 'customer-1' },
                relations: ['customer'],
            });
        });

        it('debe crear nueva cuenta si no existe', async () => {
            mockAccountRepository.findOne.mockResolvedValue(null);
            mockCustomersService.findOne.mockResolvedValue({ id: 'customer-1' });
            mockAccountRepository.create.mockReturnValue({
                customerId: 'customer-1',
                balance: 0,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
                daysOverdue: 0,
                paymentTermDays: 30,
            });
            mockAccountRepository.save.mockResolvedValue({ id: 'account-1' });
            mockAccountRepository.findOneOrFail.mockResolvedValue({
                id: 'account-1',
                customer: { firstName: 'Test', lastName: 'Customer' },
            });

            const result = await service.getOrCreateAccount('customer-1');

            expect(result).toBeDefined();
            expect(mockAccountRepository.create).toHaveBeenCalled();
            expect(result.id).toBe('account-1');
        });

        it('debe lanzar error si cliente no existe', async () => {
            mockAccountRepository.findOne.mockResolvedValue(null);
            mockCustomersService.findOne.mockRejectedValue(new NotFoundException('Cliente no encontrado'));

            await expect(service.getOrCreateAccount('customer-inexistente')).rejects.toThrow(NotFoundException);
        });

        it('debe crear nueva cuenta si no existe', async () => {
            mockAccountRepository.findOne.mockResolvedValue(null);
            mockCustomersService.findOne.mockResolvedValue({ id: 'customer-1' });
            mockAccountRepository.create.mockReturnValue({
                customerId: 'customer-1',
                balance: 0,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
                daysOverdue: 0,
            });
            mockAccountRepository.save.mockResolvedValue({ id: 'account-1' });
            mockAccountRepository.findOneOrFail.mockResolvedValue({
                id: 'account-1',
                customer: { firstName: 'Test', lastName: 'Customer' },
            });

            const result = await service.getOrCreateAccount('customer-1');

            expect(result).toBeDefined();
            expect(mockAccountRepository.create).toHaveBeenCalled();
            expect(result.id).toBe('account-1');
        });
    });

    describe('createCharge', () => {
        it('debe crear un cargo y actualizar saldo', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            const result = await service.createCharge('customer-1', {
                amount: 1500,
                description: 'Venta #001',
            });

            expect(result).toBeDefined();
            expect(mockDataSource.transaction).toHaveBeenCalled();
        });

        it('debe crear cargo con saleId', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            await service.createCharge('customer-1', {
                amount: 1500,
                description: 'Venta #001',
                saleId: 'sale-123',
                notes: 'Nota adicional',
            });

            expect(mockDataSource.transaction).toHaveBeenCalled();
        });

        it('debe lanzar error si excede límite de crédito', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 8000,
                creditLimit: 10000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.createCharge('customer-1', { amount: 3000, description: 'Cargo' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('debe probar límite de crédito exacto (boundary)', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 10000,
                creditLimit: 10000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.createCharge('customer-1', { amount: 0.01, description: 'Cargo' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('debe lanzar error si cuenta está suspendida', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000,
                creditLimit: 0,
                status: AccountStatus.SUSPENDED,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.createCharge('customer-1', { amount: 500, description: 'Cargo' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('debe convertir monto negativo a positivo', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            const createdMovements: any[] = [];
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockImplementation((entityType: any, dto: any) => {
                        createdMovements.push(dto);
                        return { id: 'movement-1' };
                    }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            await service.createCharge('customer-1', {
                amount: -1500,
                description: 'Cargo',
            });

            expect(createdMovements.length).toBeGreaterThan(0);
            expect(createdMovements[0].amount).toBe(1500); // Debe ser positivo (Math.abs(-1500))
        });

        it('debe crear cuenta si no existe en transacción y reintentar', async () => {
            // Primero getOne retorna null (cuenta no existe)
            let callCount = 0;
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                if (callCount === 0) {
                    qb.getOne.mockResolvedValue(null);
                } else {
                    // En la segunda llamada (recursiva), retorna la cuenta
                    qb.getOne.mockResolvedValue({
                        id: 'account-1',
                        customerId: 'customer-1',
                        balance: 0,
                        creditLimit: 5000,
                        status: AccountStatus.ACTIVE,
                    } as CustomerAccount);
                }
                callCount++;
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            // Mockear getOrCreateAccount para retornar cuenta
            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue({
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
                creditLimit: 5000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount);

            await service.createCharge('customer-1', { amount: 1000, description: 'Cargo' });

            // Verificar que se llamó a getOrCreateAccount
            expect(service.getOrCreateAccount).toHaveBeenCalledWith('customer-1');
        });
    });

    describe('createPayment', () => {
        it('debe registrar pago y reducir saldo', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 5000,
                status: AccountStatus.ACTIVE,
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue({ id: 'customer-1' } as Customer),
                    }),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            mockCashRegisterService.registerAccountPayment.mockResolvedValue({});

            const result = await service.createPayment('customer-1', {
                amount: 1000,
                paymentMethodId: 'pm-1',
            });

            expect(result).toBeDefined();
            expect(mockCashRegisterService.registerAccountPayment).toHaveBeenCalled();
        });

        it('debe lanzar error si no hay deuda', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue({ id: 'customer-1' } as Customer),
                    }),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.createPayment('customer-1', {
                    amount: 1000,
                    paymentMethodId: 'pm-1',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('debe lanzar error si pago excede deuda', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 500,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue({ id: 'customer-1' } as Customer),
                    }),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.createPayment('customer-1', {
                    amount: 1000,
                    paymentMethodId: 'pm-1',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('debe permitir pago sin description', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 5000,
                status: AccountStatus.ACTIVE,
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue({ id: 'customer-1' } as Customer),
                    }),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            mockCashRegisterService.registerAccountPayment.mockResolvedValue({});

            const result = await service.createPayment('customer-1', {
                amount: 1000,
                paymentMethodId: 'pm-1',
            });

            expect(result).toBeDefined();
        });

        it('debe manejar error de cashRegisterService sin fallar el pago', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 5000,
                status: AccountStatus.ACTIVE,
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue({ id: 'customer-1' } as Customer),
                    }),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            mockCashRegisterService.registerAccountPayment.mockRejectedValue(
                new Error('No hay caja abierta')
            );

            const result = await service.createPayment('customer-1', {
                amount: 1000,
                paymentMethodId: 'pm-1',
            });

            expect(result).toBeDefined();
            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });

        it('debe lanzar error si cuenta no existe', async () => {
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(null);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue(null),
                    }),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.createPayment('customer-1', {
                    amount: 1000,
                    paymentMethodId: 'pm-1',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('debe marcar ventas/ingresos como completados en pago completo', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 5000,
                status: AccountStatus.SUSPENDED, // Para probar que se cambia a ACTIVE
                daysOverdue: 45,
            } as CustomerAccount;

            let capturedAccount: CustomerAccount | null = null;

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);

                // Builder para actualizaciones bulk (necesita método update)
                const updateBuilder: any = {
                    update: jest.fn().mockReturnThis(),
                    set: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    execute: jest.fn().mockResolvedValue(undefined),
                };

                let callCount = 0;
                const manager = {
                    createQueryBuilder: jest.fn().mockImplementation((entity: any) => {
                        // Las primeras 2 llamadas son para getOne (account)
                        // Las siguientes 2 son para update (Sale, Income)
                        callCount++;
                        if (callCount <= 2) {
                            return qb;
                        }
                        return updateBuilder;
                    }),
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue({ id: 'customer-1' } as Customer),
                    }),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockImplementation(async (entity: any) => {
                        if (entity.customerId) {
                            // Es la cuenta que se está guardando
                            capturedAccount = entity;
                        }
                        return undefined;
                    }),
                };
                return callback(manager);
            });

            mockCashRegisterService.registerAccountPayment.mockResolvedValue({});

            // Pago exacto de la deuda
            await service.createPayment('customer-1', {
                amount: 5000,
                paymentMethodId: 'pm-1',
            });

            // Verificar que se actualizó la cuenta
            expect(capturedAccount).toBeDefined();
            expect(capturedAccount!.daysOverdue).toBe(0);
            expect(capturedAccount!.status).toBe(AccountStatus.ACTIVE);
            expect(capturedAccount!.lastPaymentDate).toBeInstanceOf(Date);

            consoleLogSpy.mockRestore();
        });
    });

    describe('applySurcharge', () => {
        it('debe aplicar recargo porcentual', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 10000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            let savedBalance: number | null = null;
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockImplementation((entity) => {
                        if (entity.balance !== undefined) {
                            savedBalance = entity.balance;
                        }
                        return Promise.resolve(entity);
                    }),
                };
                return callback(manager);
            });

            await service.applySurcharge('customer-1', {
                surchargeType: 'percentage',
                value: 10,
            });

            expect(savedBalance).toBe(11000); // 10000 + 10% = 11000
        });

        it('debe aplicar recargo fijo', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 5000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            let savedBalance: number | null = null;
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockImplementation((entity) => {
                        if (entity.balance !== undefined) {
                            savedBalance = entity.balance;
                        }
                        return Promise.resolve(entity);
                    }),
                };
                return callback(manager);
            });

            await service.applySurcharge('customer-1', {
                surchargeType: 'fixed',
                value: 500,
            });

            expect(savedBalance).toBe(5500);
        });

        it('debe lanzar error si no hay deuda para aplicar recargo', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.applySurcharge('customer-1', {
                    surchargeType: 'percentage',
                    value: 10,
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('debe redondear recargo porcentual a 2 decimales', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000.33,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            const createdMovements: any[] = [];
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockImplementation((entityType: any, dto: any) => {
                        // El servicio llama con (AccountMovement, {...})
                        createdMovements.push(dto);
                        return { id: 'movement-1' };
                    }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            await service.applySurcharge('customer-1', {
                surchargeType: 'percentage',
                value: 10,
            });

            expect(createdMovements.length).toBeGreaterThan(0);
            expect(createdMovements[0].amount).toBe(100.03); // 1000.33 * 0.10 = 100.033, redondeado
        });

        it('debe lanzar error si cuenta no existe', async () => {
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(null);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.applySurcharge('customer-1', {
                    surchargeType: 'fixed',
                    value: 100,
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('createAdjustment', () => {
        it('debe crear ajuste positivo (aumenta deuda)', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            let savedBalance: number | null = null;
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockImplementation((entity) => {
                        if (entity.balance !== undefined) {
                            savedBalance = entity.balance;
                        }
                        return Promise.resolve(entity);
                    }),
                };
                return callback(manager);
            });

            await service.createAdjustment('customer-1', {
                amount: 500,
                description: 'Ajuste por error de sistema',
            });

            expect(savedBalance).toBe(1500);
        });

        it('debe crear ajuste negativo (reduce deuda)', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 2000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            let savedBalance: number | null = null;
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockImplementation((entity) => {
                        if (entity.balance !== undefined) {
                            savedBalance = entity.balance;
                        }
                        return Promise.resolve(entity);
                    }),
                };
                return callback(manager);
            });

            await service.createAdjustment('customer-1', {
                amount: -500,
                description: 'Bonificación por reclamo',
            });

            expect(savedBalance).toBe(1500);
        });

        it('debe crear ajuste con referenceType y referenceId', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            const createdMovements: any[] = [];
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(account);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn().mockImplementation((entityType: any, dto: any) => {
                        createdMovements.push(dto);
                        return { id: 'movement-1' };
                    }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });

            await service.createAdjustment('customer-1', {
                amount: -100,
                description: 'Reversión de venta',
                referenceType: 'sale_reversal',
                referenceId: 'sale-123',
                notes: 'Venta cancelada',
            });

            expect(createdMovements.length).toBeGreaterThan(0);
            expect(createdMovements[0].referenceType).toBe('sale_reversal');
            expect(createdMovements[0].referenceId).toBe('sale-123');
            expect(createdMovements[0].notes).toBe('Venta cancelada');
        });

        it('debe lanzar error si cuenta no existe', async () => {
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(null);
                const manager = {
                    createQueryBuilder: jest.fn().mockReturnValue(qb),
                    create: jest.fn(),
                    save: jest.fn(),
                };
                return callback(manager);
            });

            await expect(
                service.createAdjustment('customer-1', {
                    amount: 500,
                    description: 'Ajuste',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('getAccountStatement', () => {
        it('debe retornar estado de cuenta con paginación', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 5000,
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);

            mockMovementRepository.findAndCount.mockResolvedValue([
                [
                    {
                        id: 'm1',
                        movementType: MovementType.CHARGE,
                        amount: 5000,
                        balanceBefore: 0,
                        balanceAfter: 5000,
                    },
                ],
                1,
            ]);

            mockMovementRepository.createQueryBuilder.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([
                    { type: MovementType.CHARGE, total: '5000' },
                ]),
            });

            const result = await service.getAccountStatement('customer-1', 1, 50);

            expect(result).toBeDefined();
            expect(result.summary.currentBalance).toBe(5000);
        });

        it('debe calcular customerPosition correctamente', async () => {
            // customer_owes cuando balance > 0
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000,
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);

            mockMovementRepository.findAndCount.mockResolvedValue([[], 0]);
            mockMovementRepository.createQueryBuilder.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getAccountStatement('customer-1');
            expect(result.summary.customerPosition).toBe('customer_owes');
        });

        it('debe retornar business_owes cuando balance < 0', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: -500, // El cliente tiene saldo a favor
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);

            mockMovementRepository.findAndCount.mockResolvedValue([[], 0]);
            mockMovementRepository.createQueryBuilder.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getAccountStatement('customer-1');
            expect(result.summary.customerPosition).toBe('business_owes');
        });

        it('debe retornar settled cuando balance = 0', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
                customer: { firstName: 'Juan', lastName: 'Pérez' },
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);

            mockMovementRepository.findAndCount.mockResolvedValue([[], 0]);
            mockMovementRepository.createQueryBuilder.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getAccountStatement('customer-1');
            expect(result.summary.customerPosition).toBe('settled');
        });
    });

    describe('findAll', () => {
        it('debe retornar cuentas con paginación', async () => {
            const accounts = [
                { id: 'acc-1', balance: 5000 },
                { id: 'acc-2', balance: 3000 },
            ] as CustomerAccount[];

            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([accounts, 2]);

            mockAccountRepository.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('debe filtrar por status', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);

            mockAccountRepository.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ status: AccountStatus.ACTIVE });

            expect(qb.andWhere).toHaveBeenCalledWith(
                'account.status = :status',
                { status: AccountStatus.ACTIVE }
            );
        });

        it('debe filtrar por hasDebt', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);

            mockAccountRepository.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ hasDebt: true });

            expect(qb.andWhere).toHaveBeenCalledWith('account.balance > 0');
        });

        it('debe filtrar por isOverdue', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);

            mockAccountRepository.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ isOverdue: true });

            expect(qb.andWhere).toHaveBeenCalledWith('account.daysOverdue > 0');
        });

        it('debe buscar por nombre de cliente', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);

            mockAccountRepository.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ search: 'Pérez' });

            expect(qb.andWhere).toHaveBeenCalledWith(
                '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search)',
                { search: '%Pérez%' }
            );
        });
    });

    describe('getDebtors', () => {
        it('debe retornar lista de deudores ordenada por balance', async () => {
            const debtors = [
                { id: 'acc-1', customerId: 'c1', balance: 5000, customer: { firstName: 'Juan', lastName: 'Pérez' } },
                { id: 'acc-2', customerId: 'c2', balance: 3000, customer: { firstName: 'María', lastName: 'Gómez' } },
                { id: 'acc-3', customerId: 'c3', balance: 1000, customer: { firstName: 'Carlos', lastName: 'López' } },
            ] as CustomerAccount[];

            mockAccountRepository.find.mockResolvedValue(debtors);

            const result = await service.getDebtors();

            expect(result).toHaveLength(3);
            expect(result[0].balance).toBe(5000);
            expect(mockAccountRepository.find).toHaveBeenCalledWith({
                where: { balance: expect.any(Object) },
                relations: ['customer'],
                order: { balance: 'DESC' },
            });
        });

        it('debe retornar solo cuentas con balance > 0', async () => {
            mockAccountRepository.find.mockResolvedValue([]);

            await service.getDebtors();

            expect(mockAccountRepository.find).toHaveBeenCalledWith({
                where: { balance: expect.any(Object) },
                relations: ['customer'],
                order: { balance: 'DESC' },
            });
        });
    });

    describe('getStats', () => {
        it('debe retornar estadísticas correctas', async () => {
            mockDataSource.query.mockResolvedValue([{
                totalAccounts: 10,
                activeAccounts: 8,
                suspendedAccounts: 2,
                totalDebtors: 5,
                totalDebt: '25000.50',
                overdueAccounts: 3,
                totalOverdue: '15000.00',
            }]);

            const result = await service.getStats();

            expect(result.totalAccounts).toBe(10);
            expect(result.activeAccounts).toBe(8);
            expect(result.suspendedAccounts).toBe(2);
            expect(result.totalDebtors).toBe(5);
            expect(result.totalDebt).toBe(25000.50);
            expect(result.averageDebt).toBe(25000.50 / 5);
            expect(result.overdueAccounts).toBe(3);
            expect(result.totalOverdue).toBe(15000.00);
        });

        it('debe manejar resultado vacío', async () => {
            mockDataSource.query.mockResolvedValue([{}]);

            const result = await service.getStats();

            expect(result.totalAccounts).toBe(0);
            expect(result.averageDebt).toBe(0);
        });

        it('debe calcular averageDebt como 0 cuando no hay deudores', async () => {
            mockDataSource.query.mockResolvedValue([{
                totalAccounts: 10,
                activeAccounts: 10,
                suspendedAccounts: 0,
                totalDebtors: 0,
                totalDebt: '0',
                overdueAccounts: 0,
                totalOverdue: '0',
            }]);

            const result = await service.getStats();

            expect(result.averageDebt).toBe(0);
        });
    });

    describe('getOverdueAlerts', () => {
        it('debe retornar alertas de deudores morosos', async () => {
            const overdueAccounts = [
                {
                    id: 'acc-1',
                    customerId: 'c1',
                    balance: 5000,
                    daysOverdue: 45,
                    lastPaymentDate: new Date('2025-01-01'),
                    customer: { firstName: 'Juan', lastName: 'Pérez' },
                },
            ] as CustomerAccount[];

            mockAccountRepository.find.mockResolvedValue(overdueAccounts);

            const result = await service.getOverdueAlerts();

            expect(result).toHaveLength(1);
            expect(result[0].customerId).toBe('c1');
            expect(result[0].customerName).toBe('Juan Pérez');
            expect(result[0].balance).toBe(5000);
            expect(result[0].daysOverdue).toBe(45);
        });

        it('debe retornar array vacío si no hay morosos', async () => {
            mockAccountRepository.find.mockResolvedValue([]);

            const result = await service.getOverdueAlerts();

            expect(result).toHaveLength(0);
        });
    });

    describe('getPendingTransactions', () => {
        it('debe retornar ventas e ingresos pendientes', async () => {
            const sales = [
                {
                    id: 'sale-1',
                    saleNumber: 'S001',
                    total: 1500,
                    status: SaleStatus.PENDING,
                    isOnAccount: true,
                },
            ] as Sale[];

            const incomes = [
                {
                    id: 'income-1',
                    amount: 500,
                    isPaid: false,
                    isOnAccount: true,
                },
            ] as Income[];

            mockSaleRepository.find.mockResolvedValue(sales);
            mockIncomeRepository.find.mockResolvedValue(incomes);

            const result = await service.getPendingTransactions('customer-1');

            expect(result.sales).toHaveLength(1);
            expect(result.incomes).toHaveLength(1);
        });

        it('debe incluir relaciones en ventas', async () => {
            mockSaleRepository.find.mockResolvedValue([]);
            mockIncomeRepository.find.mockResolvedValue([]);

            await service.getPendingTransactions('customer-1');

            expect(mockSaleRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    relations: ['items', 'items.product', 'customer'],
                })
            );
        });

        it('debe incluir relaciones en ingresos', async () => {
            mockSaleRepository.find.mockResolvedValue([]);
            mockIncomeRepository.find.mockResolvedValue([]);

            await service.getPendingTransactions('customer-1');

            expect(mockIncomeRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    relations: ['category', 'customer'],
                })
            );
        });
    });

    describe('updateAccount', () => {
        it('debe actualizar límite de crédito', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            // Usar spyOn para getOrCreateAccount
            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);
            mockAccountRepository.save.mockImplementation((acc) => Promise.resolve(acc));

            const result = await service.updateAccount('customer-1', {
                creditLimit: 10000,
            });

            expect(result.creditLimit).toBe(10000);
        });

        it('debe actualizar estado de cuenta', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);
            mockAccountRepository.save.mockImplementation((acc) => Promise.resolve(acc));

            const result = await service.updateAccount('customer-1', {
                status: AccountStatus.SUSPENDED,
            });

            expect(result.status).toBe(AccountStatus.SUSPENDED);
        });

        it('debe actualizar ambos límite y estado', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 1000,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);
            mockAccountRepository.save.mockImplementation((acc) => Promise.resolve(acc));

            const result = await service.updateAccount('customer-1', {
                creditLimit: 5000,
                status: AccountStatus.SUSPENDED,
            });

            expect(result.creditLimit).toBe(5000);
            expect(result.status).toBe(AccountStatus.SUSPENDED);
        });
    });

    describe('suspendAccount', () => {
        it('debe suspender cuenta activa', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 5000,
                status: AccountStatus.ACTIVE,
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);
            mockAccountRepository.save.mockResolvedValue({
                ...account,
                status: AccountStatus.SUSPENDED,
            });

            const result = await service.suspendAccount('customer-1');

            expect(result.status).toBe(AccountStatus.SUSPENDED);
            expect(mockAccountRepository.save).toHaveBeenCalled();
        });
    });

    describe('activateAccount', () => {
        it('debe activar cuenta suspendida', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 3000,
                status: AccountStatus.SUSPENDED,
            } as CustomerAccount;

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);
            mockAccountRepository.save.mockResolvedValue({
                ...account,
                status: AccountStatus.ACTIVE,
            });

            const result = await service.activateAccount('customer-1');

            expect(result.status).toBe(AccountStatus.ACTIVE);
            expect(mockAccountRepository.save).toHaveBeenCalled();
        });
    });

    describe('syncMissingCharges', () => {
        it('debe retornar vacío si no hay ventas faltantes', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
            } as CustomerAccount;

            // Mockear getOrCreateAccount porque syncMissingCharges lo llama internamente
            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);

            mockSaleRepository.find.mockResolvedValue([]);
            mockMovementRepository.find.mockResolvedValue([]);

            const result = await service.syncMissingCharges('customer-1', 'user-1');

            expect(result.chargesCreated).toBe(0);
            expect(result.totalAmount).toBe(0);
            expect(result.sales).toHaveLength(0);
        });

        it('debe sincronizar cargos faltantes', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
            } as CustomerAccount;

            const pendingSales = [
                { id: 'sale-1', saleNumber: 'S001', total: 1500 },
                { id: 'sale-2', saleNumber: 'S002', total: 2000 },
            ] as Sale[];

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);
            mockSaleRepository.find.mockResolvedValue(pendingSales);
            mockMovementRepository.find.mockResolvedValue([]);

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            mockDataSource.transaction.mockImplementation(async (callback) => {
                const manager = {
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue(null),
                    }),
                    create: jest.fn().mockReturnValue({ id: 'movement-1' }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });
            mockAccountRepository.save.mockResolvedValue(undefined);

            const result = await service.syncMissingCharges('customer-1', 'user-1');

            expect(result.chargesCreated).toBe(2);
            expect(result.totalAmount).toBe(3500);
            expect(result.sales).toHaveLength(2);
            expect(consoleLogSpy).toHaveBeenCalled();
            consoleLogSpy.mockRestore();
        });

        it('debe crear movimientos en orden cronológico', async () => {
            const account = {
                id: 'account-1',
                customerId: 'customer-1',
                balance: 0,
            } as CustomerAccount;

            // Ventas con fechas diferentes
            const pendingSales = [
                { id: 'sale-1', saleNumber: 'S001', total: 1000, saleDate: new Date('2025-01-01') },
                { id: 'sale-2', saleNumber: 'S002', total: 2000, saleDate: new Date('2025-01-02') },
            ] as Sale[];

            jest.spyOn(service, 'getOrCreateAccount').mockResolvedValue(account);
            mockSaleRepository.find.mockResolvedValue(pendingSales);
            mockMovementRepository.find.mockResolvedValue([]);

            let capturedMovements: any[] = [];
            mockDataSource.transaction.mockImplementation(async (callback) => {
                const manager = {
                    getRepository: jest.fn().mockReturnValue({
                        findOne: jest.fn().mockResolvedValue(null),
                    }),
                    create: jest.fn().mockImplementation((entityType: any, dto: any) => {
                        capturedMovements.push(dto);
                        return { id: 'movement-1' };
                    }),
                    save: jest.fn().mockResolvedValue(undefined),
                };
                return callback(manager);
            });
            mockAccountRepository.save.mockResolvedValue(undefined);

            await service.syncMissingCharges('customer-1', 'user-1');

            // Verificar que los movimientos se crean en orden
            expect(capturedMovements[0].amount).toBe(1000);
            expect(capturedMovements[1].amount).toBe(2000);
        });
    });

    describe('Cron Jobs', () => {
        describe('updateOverdueDays', () => {
            it('debe actualizar días de mora con bulk update', async () => {
                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

                mockDataSource.query.mockResolvedValue([
                    { id: 'acc-1', daysOverdue: 5, status: 'active' },
                    { id: 'acc-2', daysOverdue: 15, status: 'active' },
                ]);

                await service.updateOverdueDays();

                expect(mockDataSource.query).toHaveBeenCalled();
                expect(consoleLogSpy).toHaveBeenCalled();
                consoleLogSpy.mockRestore();
            });

            it('debe mostrar alerta si hay cuentas suspendidas', async () => {
                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

                mockDataSource.query.mockResolvedValue([
                    { id: 'acc-1', daysOverdue: 5, status: 'active' },
                    { id: 'acc-2', daysOverdue: 45, status: 'suspended' },
                ]);

                await service.updateOverdueDays();

                expect(consoleLogSpy).toHaveBeenCalledWith(
                    expect.stringContaining('cuenta(s) suspendida(s)')
                );
                consoleLogSpy.mockRestore();
            });

            it('debe manejar resultado vacío', async () => {
                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

                mockDataSource.query.mockResolvedValue([]);

                await expect(service.updateOverdueDays()).resolves.not.toThrow();
                expect(consoleLogSpy).toHaveBeenCalled();
                consoleLogSpy.mockRestore();
            });
        });

        describe('checkOverdueAccountsMonthly', () => {
            it('debe verificar y alertar sobre morosos', async () => {
                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

                // Mockear getOverdueAlerts
                jest.spyOn(service, 'getOverdueAlerts').mockResolvedValue([
                    {
                        customerId: 'customer-1',
                        customerName: 'Juan Pérez',
                        balance: 5000,
                        daysOverdue: 45,
                        lastPaymentDate: new Date('2024-11-01'),
                    },
                    {
                        customerId: 'customer-2',
                        customerName: 'María García',
                        balance: 3000,
                        daysOverdue: 30,
                        lastPaymentDate: new Date('2024-11-15'),
                    },
                ]);

                await service.checkOverdueAccountsMonthly();

                expect(consoleLogSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Hay 2 clientes morosos')
                );
                consoleLogSpy.mockRestore();
            });

            it('debe mostrar mensaje si no hay morosos', async () => {
                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

                jest.spyOn(service, 'getOverdueAlerts').mockResolvedValue([]);

                await service.checkOverdueAccountsMonthly();

                expect(consoleLogSpy).toHaveBeenCalledWith(
                    expect.stringContaining('No hay clientes morosos')
                );
                consoleLogSpy.mockRestore();
            });
        });
    });
});
