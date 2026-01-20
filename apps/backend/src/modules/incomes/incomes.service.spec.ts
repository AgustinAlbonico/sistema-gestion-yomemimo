/**
 * Tests unitarios para IncomesService
 * Cubre: create, update, remove, markAsPaid, findAll, getStats y validaciones
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { IncomesService } from './incomes.service';
import { Income, IncomeCategory } from './entities';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomerAccountsService } from '../customer-accounts/customer-accounts.service';
import { AuditService } from '../audit/audit.service';
import { createIncomeDTO } from '../../test/factories';

const mockIncomeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockCategoryRepository = {
    findOne: jest.fn(),
};

const mockCashRegisterService = {
    getOpenRegister: jest.fn(),
    registerServiceIncome: jest.fn(),
};

const mockCustomerAccountsService = {
    createCharge: jest.fn(),
};

const mockAuditService = {
    logSilent: jest.fn(),
};

describe('IncomesService', () => {
    let service: IncomesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IncomesService,
                { provide: getRepositoryToken(Income), useValue: mockIncomeRepository },
                { provide: getRepositoryToken(IncomeCategory), useValue: mockCategoryRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: CustomerAccountsService, useValue: mockCustomerAccountsService },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<IncomesService>(IncomesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('debe crear ingreso pagado cuando hay caja abierta', async () => {
            const dto = createIncomeDTO({ paymentMethodId: 'pm-1', isOnAccount: false, isPaid: true });
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockIncomeRepository.save.mockImplementation((data) => Promise.resolve({ id: 'income-1', ...data }));
            mockIncomeRepository.create.mockImplementation((data) => ({ id: 'income-1', ...data }));
            mockIncomeRepository.findOne.mockResolvedValue({
                id: 'income-1',
                ...dto,
                category: null,
                customer: null,
                paymentMethod: { id: 'pm-1', name: 'Efectivo' },
                createdBy: null,
            });

            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
            expect(mockCashRegisterService.registerServiceIncome).toHaveBeenCalled();
            expect(mockAuditService.logSilent).toHaveBeenCalled();
        });

        it('debe crear ingreso pendiente (no pagado)', async () => {
            const dto = createIncomeDTO({ paymentMethodId: 'pm-1', isPaid: false });
            mockIncomeRepository.save.mockImplementation((data) => Promise.resolve({ id: 'income-1', ...data }));
            mockIncomeRepository.create.mockReturnValue(dto);
            mockIncomeRepository.findOne.mockResolvedValue({
                id: 'income-1',
                ...dto,
                category: null,
                customer: null,
                paymentMethod: null,
                createdBy: null,
            });

            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
            expect(result.isPaid).toBe(false);
            expect(mockCashRegisterService.registerServiceIncome).not.toHaveBeenCalled();
        });

        it('debe crear ingreso a cuenta corriente', async () => {
            const dto = createIncomeDTO({
                customerId: 'customer-1',
                isOnAccount: true,
                isPaid: false,
                paymentMethodId: 'pm-1',
            });
            mockIncomeRepository.save.mockImplementation((data) => Promise.resolve({ id: 'income-1', ...data }));
            mockIncomeRepository.create.mockReturnValue(dto);
            mockIncomeRepository.findOne.mockResolvedValue({
                id: 'income-1',
                ...dto,
                category: null,
                customer: { id: 'customer-1', firstName: 'Juan', lastName: 'Pérez' },
                paymentMethod: null,
                createdBy: null,
            });

            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
            expect(mockCustomerAccountsService.createCharge).toHaveBeenCalledWith(
                'customer-1',
                expect.objectContaining({
                    amount: dto.amount,
                    description: `Ingreso: ${dto.description}`,
                }),
                'user-1',
            );
        });

        it('debe fallar si no hay caja abierta para ingreso pagado', async () => {
            const dto = createIncomeDTO({ paymentMethodId: 'pm-1', isOnAccount: false, isPaid: true });
            mockCashRegisterService.getOpenRegister.mockResolvedValue(null);

            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                new BadRequestException('No hay caja abierta. Debe abrir la caja antes de registrar ingresos pagados.')
            );
        });

        it('debe fallar si no hay cliente para ingreso a cuenta corriente', async () => {
            const dto = createIncomeDTO({ isOnAccount: true, customerId: undefined });

            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                new BadRequestException('Para ingresos a cuenta corriente debe seleccionar un cliente')
            );
        });

        it('debe fallar si no hay método de pago para ingreso normal', async () => {
            const dto = createIncomeDTO({ isOnAccount: false, paymentMethodId: undefined });

            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                new BadRequestException('Debe seleccionar un método de pago para ingresos que no son a cuenta corriente')
            );
        });

        it('debe fallar si no existe categoría', async () => {
            const dto = createIncomeDTO({ categoryId: 'cat-1', paymentMethodId: 'pm-1' });
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockCategoryRepository.findOne.mockResolvedValue(null);

            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                new NotFoundException('Categoría con ID cat-1 no encontrada')
            );
        });
    });

    describe('findAll', () => {
        it('debe retornar lista paginada de ingresos', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(2),
                getMany: jest.fn().mockResolvedValue([
                    { id: 'income-1', description: 'Ingreso 1', amount: 1000 },
                    { id: 'income-2', description: 'Ingreso 2', amount: 2000 },
                ]),
            };
            mockIncomeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
        });

        it('debe filtrar por categoría', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(1),
                getMany: jest.fn().mockResolvedValue([{ id: 'income-1' }]),
            };
            mockIncomeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({ categoryId: 'cat-1', page: 1, limit: 10 });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'income.categoryId = :categoryId',
                { categoryId: 'cat-1' }
            );
        });

        it('debe filtrar por cliente', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(1),
                getMany: jest.fn().mockResolvedValue([{ id: 'income-1' }]),
            };
            mockIncomeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({ customerId: 'customer-1', page: 1, limit: 10 });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'income.customerId = :customerId',
                { customerId: 'customer-1' }
            );
        });

        it('debe filtrar por rango de fechas', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            };
            mockIncomeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                page: 1,
                limit: 10,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
        });

        it('debe filtrar por estado de pago', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(1),
                getMany: jest.fn().mockResolvedValue([{ id: 'income-1' }]),
            };
            mockIncomeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({ isPaid: false, page: 1, limit: 10 });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'income.isPaid = :isPaid',
                { isPaid: false }
            );
        });
    });

    describe('findOne', () => {
        it('debe retornar ingreso por ID', async () => {
            const income = {
                id: 'income-1',
                description: 'Ingreso test',
                amount: 1000,
                category: null,
                customer: null,
                paymentMethod: null,
                createdBy: null,
            };
            mockIncomeRepository.findOne.mockResolvedValue(income);

            const result = await service.findOne('income-1');

            expect(result).toEqual(income);
            expect(mockIncomeRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'income-1' },
                relations: ['category', 'customer', 'paymentMethod', 'createdBy'],
            });
        });

        it('debe lanzar error si no existe', async () => {
            mockIncomeRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('income-inexistente')).rejects.toThrow(
                new NotFoundException('Ingreso con ID income-inexistente no encontrado')
            );
        });
    });

    describe('update', () => {
        it('debe actualizar descripción y monto', async () => {
            const existingIncome = {
                id: 'income-1',
                description: 'Descripción original',
                amount: 1000,
                isOnAccount: false,
                categoryId: null,
            };
            mockIncomeRepository.findOne.mockResolvedValue(existingIncome);
            mockIncomeRepository.save.mockResolvedValue({});
            mockIncomeRepository.findOne.mockResolvedValue({
                ...existingIncome,
                description: 'Nueva descripción',
                amount: 1500,
            });

            const result = await service.update('income-1', {
                description: 'Nueva descripción',
                amount: 1500,
            });

            expect(result).toBeDefined();
        });

        it('debe fallar si intenta cambiar isOnAccount', async () => {
            const existingIncome = {
                id: 'income-1',
                description: 'Ingreso',
                amount: 1000,
                isOnAccount: false,
            };
            mockIncomeRepository.findOne.mockResolvedValue(existingIncome);

            await expect(
                service.update('income-1', { isOnAccount: true })
            ).rejects.toThrow(
                new BadRequestException('No se puede cambiar el tipo de cuenta de un ingreso ya registrado')
            );
        });

        it('debe fallar si categoría no existe', async () => {
            const existingIncome = {
                id: 'income-1',
                description: 'Ingreso',
                amount: 1000,
                categoryId: 'cat-old',
                isOnAccount: false,
            };
            mockIncomeRepository.findOne.mockResolvedValue(existingIncome);
            mockCategoryRepository.findOne.mockResolvedValue(null);

            await expect(
                service.update('income-1', { categoryId: 'cat-inexistente' })
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('debe eliminar ingreso (soft delete)', async () => {
            const income = {
                id: 'income-1',
                description: 'Ingreso a eliminar',
                amount: 1000,
                isPaid: true,
            };
            mockIncomeRepository.findOne.mockResolvedValue(income);
            mockIncomeRepository.softDelete.mockResolvedValue({ affected: 1 });

            const result = await service.remove('income-1', 'user-1');

            expect(result).toEqual({ message: 'Ingreso eliminado correctamente' });
            expect(mockIncomeRepository.softDelete).toHaveBeenCalledWith('income-1');
            expect(mockAuditService.logSilent).toHaveBeenCalled();
        });
    });

    describe('markAsPaid', () => {
        it('debe marcar ingreso como cobrado', async () => {
            const income = {
                id: 'income-1',
                description: 'Ingreso pendiente',
                amount: 1000,
                isPaid: false,
                isOnAccount: false,
            };
            mockIncomeRepository.findOne.mockResolvedValue(income);
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockIncomeRepository.save.mockResolvedValue({
                ...income,
                isPaid: true,
                paidAt: new Date(),
            });
            mockCashRegisterService.registerServiceIncome.mockResolvedValue({});

            const result = await service.markAsPaid('income-1', 'user-1', 'pm-1');

            expect(result.isPaid).toBe(true);
            expect(mockCashRegisterService.registerServiceIncome).toHaveBeenCalled();
            expect(mockAuditService.logSilent).toHaveBeenCalled();
        });

        it('debe fallar si ingreso ya está pagado', async () => {
            const income = {
                id: 'income-1',
                description: 'Ingreso pagado',
                amount: 1000,
                isPaid: true,
                isOnAccount: false,
            };
            mockIncomeRepository.findOne.mockResolvedValue(income);

            await expect(
                service.markAsPaid('income-1', 'user-1', 'pm-1')
            ).rejects.toThrow(new BadRequestException('Este ingreso ya está marcado como cobrado'));
        });

        it('debe fallar si ingreso es a cuenta corriente', async () => {
            const income = {
                id: 'income-1',
                description: 'Ingreso CC',
                amount: 1000,
                isPaid: false,
                isOnAccount: true,
            };
            mockIncomeRepository.findOne.mockResolvedValue(income);

            await expect(
                service.markAsPaid('income-1', 'user-1', 'pm-1')
            ).rejects.toThrow(
                new BadRequestException('Los ingresos a cuenta corriente no se marcan como cobrados desde aquí')
            );
        });

        it('debe fallar si no hay caja abierta', async () => {
            const income = {
                id: 'income-1',
                description: 'Ingreso pendiente',
                amount: 1000,
                isPaid: false,
                isOnAccount: false,
            };
            mockIncomeRepository.findOne.mockResolvedValue(income);
            mockCashRegisterService.getOpenRegister.mockResolvedValue(null);

            await expect(
                service.markAsPaid('income-1', 'user-1', 'pm-1')
            ).rejects.toThrow(
                new BadRequestException('No hay caja abierta. Debe abrir la caja antes de marcar ingresos como cobrados.')
            );
        });
    });

    describe('getStats', () => {
        it('debe retornar estadísticas de ingresos', async () => {
            const mockCategoryQueryBuilder = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                addGroupBy: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([
                    { categoryId: 'cat-1', categoryName: 'Servicios', count: '3', total: '9000' },
                    { categoryId: null, categoryName: 'Sin categoría', count: '2', total: '6000' },
                ]),
            };

            const mockMainQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({
                    totalIncomes: '5',
                    totalAmount: '15000',
                    totalPending: '3000',
                }),
            };

            mockIncomeRepository.createQueryBuilder
                .mockReturnValueOnce(mockMainQueryBuilder as never)
                .mockReturnValueOnce(mockCategoryQueryBuilder as never);

            const result = await service.getStats('2024-01-01', '2024-01-31');

            expect(result.totalIncomes).toBe(5);
            expect(result.totalAmount).toBe(15000);
            expect(result.totalPending).toBe(3000);
            expect(result.byCategory).toHaveLength(2);
        });

        it('debe manejar valores nulos en estadísticas', async () => {
            const mockCategoryQueryBuilder = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                addGroupBy: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
            };

            const mockMainQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({}),
            };

            mockIncomeRepository.createQueryBuilder
                .mockReturnValueOnce(mockMainQueryBuilder as never)
                .mockReturnValueOnce(mockCategoryQueryBuilder as never);

            const result = await service.getStats();

            expect(result.totalIncomes).toBe(0);
            expect(result.totalAmount).toBe(0);
            expect(result.byCategory).toEqual([]);
        });

        it('debe filtrar por rango de fechas', async () => {
            const mockCategoryQueryBuilder = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                addGroupBy: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
            };

            const mockMainQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({
                    totalIncomes: '1',
                    totalAmount: '5000',
                    totalPending: '0',
                }),
            };

            mockIncomeRepository.createQueryBuilder
                .mockReturnValueOnce(mockMainQueryBuilder as never)
                .mockReturnValueOnce(mockCategoryQueryBuilder as never);

            await service.getStats('2024-01-01', '2024-01-31');

            expect(mockMainQueryBuilder.andWhere).toHaveBeenCalledWith(
                'income.incomeDate >= :startDate',
                expect.objectContaining({ startDate: expect.any(Date) })
            );
        });
    });
});
