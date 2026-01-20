/**
 * Tests unitarios para ExpensesService
 * Cubre: create, update, remove, markAsPaid, findAll, getStats y validaciones
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { AuditService } from '../audit/audit.service';
import { createExpenseDTO } from '../../test/factories';

const mockExpenseRepository = {
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
    registerExpense: jest.fn(),
};

const mockAuditService = {
    logSilent: jest.fn(),
};

describe('ExpensesService', () => {
    let service: ExpensesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExpensesService,
                { provide: getRepositoryToken(Expense), useValue: mockExpenseRepository },
                { provide: getRepositoryToken(ExpenseCategory), useValue: mockCategoryRepository },
                { provide: CashRegisterService, useValue: mockCashRegisterService },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<ExpensesService>(ExpensesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('debe crear gasto pagado si hay caja abierta', async () => {
            const dto = createExpenseDTO({ paymentMethodId: 'pm-1', isPaid: true });
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve({ id: 'expense-1', ...data }));
            mockExpenseRepository.create.mockReturnValue(dto);
            mockCashRegisterService.registerExpense.mockResolvedValue({});

            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
            expect(mockCashRegisterService.registerExpense).toHaveBeenCalled();
            expect(mockAuditService.logSilent).toHaveBeenCalled();
        });

        it('debe crear gasto pendiente (no requiere caja)', async () => {
            const dto = createExpenseDTO({ paymentMethodId: 'pm-1', isPaid: false });
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve({ id: 'expense-1', ...data }));
            mockExpenseRepository.create.mockReturnValue(dto);

            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
            expect(result.isPaid).toBe(false);
            expect(mockCashRegisterService.registerExpense).not.toHaveBeenCalled();
        });

        it('debe crear gasto con categoría', async () => {
            const category = { id: 'cat-1', name: 'Proveedores' };
            const dto = createExpenseDTO({
                categoryId: 'cat-1',
                paymentMethodId: 'pm-1',
                isPaid: false,
            });
            mockCategoryRepository.findOne.mockResolvedValue(category);
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve({ id: 'expense-1', ...data }));
            mockExpenseRepository.create.mockReturnValue(dto);

            const result = await service.create(dto, 'user-1');

            expect(result).toBeDefined();
            expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
            });
        });

        it('debe fallar si no hay caja abierta y gasto es pagado', async () => {
            const dto = createExpenseDTO({ paymentMethodId: 'pm-1', isPaid: true });
            mockCashRegisterService.getOpenRegister.mockResolvedValue(null);

            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                new BadRequestException('No hay caja abierta. Debe abrir la caja antes de registrar gastos pagados.')
            );
        });

        it('debe fallar si categoría no existe', async () => {
            const dto = createExpenseDTO({ categoryId: 'cat-1', paymentMethodId: 'pm-1' });
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockCategoryRepository.findOne.mockResolvedValue(null);

            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                new NotFoundException('Categoría no encontrada')
            );
        });
    });

    describe('findAll', () => {
        it('debe retornar lista paginada de gastos', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([
                    [
                        { id: 'expense-1', description: 'Gasto 1', amount: 1000 },
                        { id: 'expense-2', description: 'Gasto 2', amount: 2000 },
                    ],
                    2,
                ]),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
        });

        it('debe filtrar por categoría', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'expense-1' }], 1]),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({ categoryId: 'cat-1', page: 1, limit: 10 });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'expense.categoryId = :categoryId',
                { categoryId: 'cat-1' }
            );
        });

        it('debe filtrar por búsqueda de texto', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'expense-1' }], 1]),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({ search: 'proveedor', page: 1, limit: 10 });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'expense.description ILIKE :search',
                { search: '%proveedor%' }
            );
        });

        it('debe filtrar por estado de pago', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'expense-1' }], 1]),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({ isPaid: false, page: 1, limit: 10 });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'expense.isPaid = :isPaid',
                { isPaid: false }
            );
        });

        it('debe filtrar por rango de fechas', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                page: 1,
                limit: 10,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'expense.expenseDate BETWEEN :start AND :end',
                { start: '2024-01-01', end: '2024-01-31' }
            );
        });

        it('debe ordenar por campo especificado', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.findAll({ sortBy: 'amount', order: 'ASC', page: 1, limit: 10 });

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('expense.amount', 'ASC');
        });
    });

    describe('findOne', () => {
        it('debe retornar gasto por ID', async () => {
            const expense = {
                id: 'expense-1',
                description: 'Gasto test',
                amount: 1000,
                category: null,
                paymentMethod: null,
                createdBy: null,
            };
            mockExpenseRepository.findOne.mockResolvedValue(expense);

            const result = await service.findOne('expense-1');

            expect(result).toEqual(expense);
            expect(mockExpenseRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'expense-1' },
                relations: ['category', 'createdBy', 'paymentMethod'],
            });
        });

        it('debe lanzar error si no existe', async () => {
            mockExpenseRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('expense-inexistente')).rejects.toThrow(
                new NotFoundException('Gasto con ID expense-inexistente no encontrado')
            );
        });
    });

    describe('update', () => {
        it('debe actualizar descripción y monto', async () => {
            const existingExpense = {
                id: 'expense-1',
                description: 'Descripción original',
                amount: 1000,
                categoryId: null,
                isPaid: false,
                paidAt: null,
                expenseDate: new Date('2024-01-01'),
            };
            mockExpenseRepository.findOne.mockResolvedValue(existingExpense);
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve(data));

            const result = await service.update('expense-1', {
                description: 'Nueva descripción',
                amount: 1500,
            });

            expect(result.description).toBe('Nueva descripción');
            expect(result.amount).toBe(1500);
        });

        it('debe actualizar categoría existente', async () => {
            const existingExpense = {
                id: 'expense-1',
                description: 'Gasto',
                amount: 1000,
                categoryId: 'cat-old',
                category: null,
                isPaid: false,
                expenseDate: new Date(),
            };
            const newCategory = { id: 'cat-new', name: 'Nueva categoría' };

            mockExpenseRepository.findOne.mockResolvedValue(existingExpense);
            mockCategoryRepository.findOne.mockResolvedValue(newCategory);
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve(data));

            const result = await service.update('expense-1', { categoryId: 'cat-new' });

            expect(result.categoryId).toBe('cat-new');
        });

        it('debe permitir quitar categoría', async () => {
            const existingExpense = {
                id: 'expense-1',
                description: 'Gasto',
                amount: 1000,
                categoryId: 'cat-1',
                category: null,
                isPaid: false,
                expenseDate: new Date(),
            };
            mockExpenseRepository.findOne.mockResolvedValue(existingExpense);
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve(data));

            const result = await service.update('expense-1', { categoryId: null as never });

            expect(result.categoryId).toBeNull();
        });

        it('debe fallar si categoría no existe', async () => {
            const existingExpense = {
                id: 'expense-1',
                description: 'Gasto',
                amount: 1000,
                categoryId: null,
                isPaid: false,
                expenseDate: new Date(),
            };
            mockExpenseRepository.findOne.mockResolvedValue(existingExpense);
            mockCategoryRepository.findOne.mockResolvedValue(null);

            await expect(
                service.update('expense-1', { categoryId: 'cat-inexistente' })
            ).rejects.toThrow(new NotFoundException('Categoría no encontrada'));
        });

        it('debe marcar como pagado al actualizar isPaid a true', async () => {
            const existingExpense = {
                id: 'expense-1',
                description: 'Gasto',
                amount: 1000,
                isPaid: false,
                paidAt: null,
                expenseDate: new Date('2024-01-01'),
                categoryId: null,
            };
            mockExpenseRepository.findOne.mockResolvedValue(existingExpense);
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve(data));

            const result = await service.update('expense-1', { isPaid: true });

            expect(result.isPaid).toBe(true);
            expect(result.paidAt).not.toBeNull();
        });

        it('debe quitar fecha de pago al marcar como no pagado', async () => {
            const existingExpense = {
                id: 'expense-1',
                description: 'Gasto',
                amount: 1000,
                isPaid: true,
                paidAt: new Date(),
                expenseDate: new Date('2024-01-01'),
                categoryId: null,
            };
            mockExpenseRepository.findOne.mockResolvedValue(existingExpense);
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve(data));

            const result = await service.update('expense-1', { isPaid: false });

            expect(result.isPaid).toBe(false);
            expect(result.paidAt).toBeNull();
        });
    });

    describe('remove', () => {
        it('debe eliminar gasto (soft delete)', async () => {
            const expense = {
                id: 'expense-1',
                description: 'Gasto a eliminar',
                amount: 1000,
                isPaid: true,
            };
            mockExpenseRepository.findOne.mockResolvedValue(expense);
            mockExpenseRepository.softDelete.mockResolvedValue({ affected: 1 });

            const result = await service.remove('expense-1', 'user-1');

            expect(result).toEqual({ message: 'Gasto eliminado' });
            expect(mockExpenseRepository.softDelete).toHaveBeenCalledWith('expense-1');
            expect(mockAuditService.logSilent).toHaveBeenCalled();
        });
    });

    describe('markAsPaid', () => {
        it('debe marcar gasto como pagado y registrar en caja', async () => {
            const expense = {
                id: 'expense-1',
                description: 'Gasto pendiente',
                amount: 1000,
                isPaid: false,
                paymentMethodId: null,
            };
            mockExpenseRepository.findOne.mockResolvedValue(expense);
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });
            mockExpenseRepository.save.mockImplementation((data) => Promise.resolve(data));
            mockCashRegisterService.registerExpense.mockResolvedValue({});

            const result = await service.markAsPaid('expense-1', 'user-1', 'pm-1');

            expect(result.isPaid).toBe(true);
            expect(result.paymentMethodId).toBe('pm-1');
            expect(result.paidAt).not.toBeNull();
            expect(mockCashRegisterService.registerExpense).toHaveBeenCalled();
            expect(mockAuditService.logSilent).toHaveBeenCalled();
        });

        it('debe fallar si gasto ya está pagado', async () => {
            const expense = {
                id: 'expense-1',
                description: 'Gasto pagado',
                amount: 1000,
                isPaid: true,
            };
            mockExpenseRepository.findOne.mockResolvedValue(expense);

            await expect(
                service.markAsPaid('expense-1', 'user-1', 'pm-1')
            ).rejects.toThrow(new BadRequestException('Este gasto ya está marcado como pagado'));
        });

        it('debe fallar si no hay caja abierta', async () => {
            const expense = {
                id: 'expense-1',
                description: 'Gasto pendiente',
                amount: 1000,
                isPaid: false,
            };
            mockExpenseRepository.findOne.mockResolvedValue(expense);
            mockCashRegisterService.getOpenRegister.mockResolvedValue(null);

            await expect(
                service.markAsPaid('expense-1', 'user-1', 'pm-1')
            ).rejects.toThrow(
                new BadRequestException('No hay caja abierta. Debe abrir la caja antes de marcar gastos como pagados.')
            );
        });

        it('debe revertir cambios si falla registro en caja', async () => {
            const expense = {
                id: 'expense-1',
                description: 'Gasto pendiente',
                amount: 1000,
                isPaid: false,
                paidAt: null,
                paymentMethodId: null,
            };
            mockExpenseRepository.findOne.mockResolvedValue(expense);
            mockCashRegisterService.getOpenRegister.mockResolvedValue({ id: 'cash-1' });

            // Primer save marca como pagado
            mockExpenseRepository.save.mockImplementationOnce((data) => {
                if (data.isPaid === true) {
                    return Promise.resolve({ ...expense, isPaid: true, paidAt: new Date() });
                }
                return Promise.resolve(data);
            });

            mockCashRegisterService.registerExpense.mockRejectedValue(
                new Error('Error en caja')
            );

            // Segundo save revertea el cambio
            mockExpenseRepository.save.mockImplementationOnce((data) => {
                return Promise.resolve({ ...data, isPaid: false, paidAt: null });
            });

            await expect(
                service.markAsPaid('expense-1', 'user-1', 'pm-1')
            ).rejects.toThrow(BadRequestException);

            // Verificar que se llamó a save dos veces (una para marcar, otra para revertir)
            expect(mockExpenseRepository.save).toHaveBeenCalledTimes(2);
        });
    });

    describe('getStats', () => {
        it('debe retornar estadísticas de gastos', async () => {
            const expenses = [
                { id: 'expense-1', description: 'Gasto 1', amount: 1000, isPaid: true, categoryId: 'cat-1', category: { name: 'Servicios' } },
                { id: 'expense-2', description: 'Gasto 2', amount: 2000, isPaid: true, categoryId: 'cat-1', category: { name: 'Servicios' } },
                { id: 'expense-3', description: 'Gasto 3', amount: 1500, isPaid: false, categoryId: null, category: null },
            ];

            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(expenses),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.getStats('2024-01-01', '2024-01-31');

            expect(result.totalExpenses).toBe(3);
            expect(result.totalAmount).toBe(3000); // Solo pagados (1000 + 2000)
            expect(result.totalPending).toBe(1500); // Solo pendientes
            expect(result.byCategory).toHaveLength(1); // Solo 'cat-1' porque expense-3 no está pagado
        });

        it('debe manejar lista vacía de gastos', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.getStats();

            expect(result.totalExpenses).toBe(0);
            expect(result.totalAmount).toBe(0);
            expect(result.totalPending).toBe(0);
            expect(result.byCategory).toEqual([]);
        });

        it('debe agrupar por categoría y ordenar por total descendente', async () => {
            const expenses = [
                { id: 'expense-1', amount: 500, isPaid: true, categoryId: 'cat-2', category: { name: 'Oficina' } },
                { id: 'expense-2', amount: 2000, isPaid: true, categoryId: 'cat-1', category: { name: 'Servicios' } },
                { id: 'expense-3', amount: 1500, isPaid: true, categoryId: 'cat-1', category: { name: 'Servicios' } },
                { id: 'expense-4', amount: 800, isPaid: true, categoryId: null, category: null },
            ];

            const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(expenses),
            };
            mockExpenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.getStats();

            expect(result.byCategory[0].categoryName).toBe('Servicios'); // Mayor total (3500)
            expect(result.byCategory[0].total).toBe(3500);
            expect(result.byCategory[1].total).toBe(800); // Sin categoría
            expect(result.byCategory[2].total).toBe(500); // Oficina
        });
    });
});
