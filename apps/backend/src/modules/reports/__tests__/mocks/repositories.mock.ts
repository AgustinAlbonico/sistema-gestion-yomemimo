/**
 * Mock Repositories for Reports Module Tests
 * Provides reusable mock implementations of TypeORM repositories
 */

import { Sale } from '../../../sales/entities/sale.entity';
import { SaleItem } from '../../../sales/entities/sale-item.entity';
import { SalePayment } from '../../../sales/entities/sale-payment.entity';
import { Purchase } from '../../../purchases/entities/purchase.entity';
import { Expense } from '../../../expenses/entities/expense.entity';
import { Income } from '../../../incomes/entities/income.entity';
import { Product } from '../../../products/entities/product.entity';
import { Customer } from '../../../customers/entities/customer.entity';
import { CustomerAccount } from '../../../customer-accounts/entities/customer-account.entity';
import { AccountMovement } from '../../../customer-accounts/entities/account-movement.entity';

// ============================================
// QUERY BUILDER MOCK
// ============================================

export interface MockQueryBuilder<T> {
    where: jest.Mock;
    andWhere: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    innerJoin: jest.Mock;
    getMany: jest.Mock;
    getOne: jest.Mock;
    getManyAndCount: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    groupBy: jest.Mock;
    having: jest.Mock;
    getRawMany: jest.Mock;
    getRawOne: jest.Mock;
    setFindOptions: jest.Mock;
    _returnData: T[];
}

export function createMockQueryBuilder<T>(returnData: T[] = []): MockQueryBuilder<T> {
    const queryBuilder: MockQueryBuilder<T> = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(returnData),
        getOne: jest.fn().mockResolvedValue(returnData[0] ?? null),
        getManyAndCount: jest.fn().mockResolvedValue([returnData, returnData.length]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(returnData),
        getRawOne: jest.fn().mockResolvedValue(returnData[0] ?? null),
        setFindOptions: jest.fn().mockReturnThis(),
        _returnData: returnData,
    };
    return queryBuilder;
}

export function updateMockQueryBuilderData<T>(
    queryBuilder: MockQueryBuilder<T>,
    newData: T[]
): void {
    queryBuilder._returnData = newData;
    queryBuilder.getMany.mockResolvedValue(newData);
    queryBuilder.getOne.mockResolvedValue(newData[0] ?? null);
    queryBuilder.getManyAndCount.mockResolvedValue([newData, newData.length]);
    queryBuilder.getRawMany.mockResolvedValue(newData);
    queryBuilder.getRawOne.mockResolvedValue(newData[0] ?? null);
}

// ============================================
// REPOSITORY MOCKS
// ============================================

export interface MockRepository<T> {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    softDelete: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
    _queryBuilder: MockQueryBuilder<T>;
}

export function createMockRepository<T>(initialData: T[] = []): MockRepository<T> {
    const queryBuilder = createMockQueryBuilder<T>(initialData);
    
    return {
        find: jest.fn().mockResolvedValue(initialData),
        findOne: jest.fn().mockResolvedValue(initialData[0] ?? null),
        findOneBy: jest.fn().mockResolvedValue(initialData[0] ?? null),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        create: jest.fn().mockImplementation((dto) => dto),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
        count: jest.fn().mockResolvedValue(initialData.length),
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        _queryBuilder: queryBuilder,
    };
}

// ============================================
// TYPE-SPECIFIC REPOSITORY MOCKS
// ============================================

export type MockSaleRepository = MockRepository<Sale>;
export type MockSaleItemRepository = MockRepository<SaleItem>;
export type MockSalePaymentRepository = MockRepository<SalePayment>;
export type MockPurchaseRepository = MockRepository<Purchase>;
export type MockExpenseRepository = MockRepository<Expense>;
export type MockIncomeRepository = MockRepository<Income>;
export type MockProductRepository = MockRepository<Product>;
export type MockCustomerRepository = MockRepository<Customer>;
export type MockCustomerAccountRepository = MockRepository<CustomerAccount>;
export type MockAccountMovementRepository = MockRepository<AccountMovement>;

// ============================================
// SERVICE MOCKS
// ============================================

export interface MockCashRegisterService {
    getOpenRegister: jest.Mock;
}

export function createMockCashRegisterService(): MockCashRegisterService {
    return {
        getOpenRegister: jest.fn().mockResolvedValue(null),
    };
}

export function mockOpenCashRegister(
    service: MockCashRegisterService,
    data?: Partial<{
        id: string;
        initialAmount: number;
        totalIncome: number;
        totalExpense: number;
        openedAt: Date;
        openedBy: { firstName: string };
    }>
): void {
    service.getOpenRegister.mockResolvedValue({
        id: 'register-1',
        initialAmount: 1000,
        totalIncome: 500,
        totalExpense: 200,
        openedAt: new Date(),
        openedBy: { firstName: 'Admin' },
        ...data,
    });
}

export interface MockConfigurationService {
    getMinStockAlert: jest.Mock;
    get: jest.Mock;
}

export function createMockConfigurationService(): MockConfigurationService {
    return {
        getMinStockAlert: jest.fn().mockResolvedValue(5),
        get: jest.fn().mockResolvedValue(null),
    };
}

// ============================================
// ALL REPOSITORIES BUNDLE
// ============================================

export interface AllMockRepositories {
    saleRepo: MockSaleRepository;
    saleItemRepo: MockSaleItemRepository;
    salePaymentRepo: MockSalePaymentRepository;
    purchaseRepo: MockPurchaseRepository;
    expenseRepo: MockExpenseRepository;
    incomeRepo: MockIncomeRepository;
    productRepo: MockProductRepository;
    customerRepo: MockCustomerRepository;
    accountRepo: MockCustomerAccountRepository;
    accountMovementRepo: MockAccountMovementRepository;
    cashRegisterService: MockCashRegisterService;
    configurationService: MockConfigurationService;
}

export function createAllMockRepositories(): AllMockRepositories {
    return {
        saleRepo: createMockRepository<Sale>(),
        saleItemRepo: createMockRepository<SaleItem>(),
        salePaymentRepo: createMockRepository<SalePayment>(),
        purchaseRepo: createMockRepository<Purchase>(),
        expenseRepo: createMockRepository<Expense>(),
        incomeRepo: createMockRepository<Income>(),
        productRepo: createMockRepository<Product>(),
        customerRepo: createMockRepository<Customer>(),
        accountRepo: createMockRepository<CustomerAccount>(),
        accountMovementRepo: createMockRepository<AccountMovement>(),
        cashRegisterService: createMockCashRegisterService(),
        configurationService: createMockConfigurationService(),
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Configure a repository's query builder to return different data
 * based on the query conditions (useful for date-based filters)
 */
export function configureQueryBuilderByCondition<T>(
    repo: MockRepository<T>,
    conditionMatcher: (args: Record<string, unknown>) => T[]
): void {
    const queryBuilder = repo._queryBuilder;
    
    let capturedConditions: Record<string, unknown> = {};
    
    queryBuilder.where.mockImplementation((_condition: string, params?: Record<string, unknown>) => {
        if (params) {
            capturedConditions = { ...capturedConditions, ...params };
        }
        return queryBuilder;
    });
    
    queryBuilder.andWhere.mockImplementation((_condition: string, params?: Record<string, unknown>) => {
        if (params) {
            capturedConditions = { ...capturedConditions, ...params };
        }
        return queryBuilder;
    });
    
    queryBuilder.getMany.mockImplementation(() => {
        const result = conditionMatcher(capturedConditions);
        capturedConditions = {}; // Reset for next query
        return Promise.resolve(result);
    });
}

/**
 * Reset all mocks in a repository bundle
 */
export function resetAllMocks(repos: AllMockRepositories): void {
    Object.values(repos).forEach((repo) => {
        if (typeof repo === 'object' && repo !== null) {
            Object.values(repo).forEach((mock) => {
                if (typeof mock === 'function' && 'mockClear' in mock) {
                    (mock as jest.Mock).mockClear();
                }
            });
        }
    });
}
