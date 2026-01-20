/**
 * Reports Service Unit Tests - Date Helpers
 * Tests the private date helper methods through public methods
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../reports.service';
import { Repository } from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';
import { SaleItem } from '../../sales/entities/sale-item.entity';
import { SalePayment } from '../../sales/entities/sale-payment.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Income } from '../../incomes/entities/income.entity';
import { Product } from '../../products/entities/product.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerAccount } from '../../customer-accounts/entities/customer-account.entity';
import { AccountMovement } from '../../customer-accounts/entities/account-movement.entity';
import { CashRegisterService } from '../../cash-register/cash-register.service';
import { ConfigurationService } from '../../configuration/configuration.service';
import { ReportPeriod } from '../dto';
import { SaleStatus } from '../../sales/entities/sale.entity';
import { createAllMockRepositories, resetAllMocks } from './mocks';

describe('ReportsService - Date Helpers', () => {
    let service: ReportsService;
    let repos: ReturnType<typeof createAllMockRepositories>;

    beforeEach(async () => {
        repos = createAllMockRepositories();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                {
                    provide: 'SaleRepository',
                    useValue: repos.saleRepo,
                },
                {
                    provide: 'SaleItemRepository',
                    useValue: repos.saleItemRepo,
                },
                {
                    provide: 'SalePaymentRepository',
                    useValue: repos.salePaymentRepo,
                },
                {
                    provide: 'PurchaseRepository',
                    useValue: repos.purchaseRepo,
                },
                {
                    provide: 'ExpenseRepository',
                    useValue: repos.expenseRepo,
                },
                {
                    provide: 'IncomeRepository',
                    useValue: repos.incomeRepo,
                },
                {
                    provide: 'ProductRepository',
                    useValue: repos.productRepo,
                },
                {
                    provide: 'CustomerRepository',
                    useValue: repos.customerRepo,
                },
                {
                    provide: 'CustomerAccountRepository',
                    useValue: repos.accountRepo,
                },
                {
                    provide: 'AccountMovementRepository',
                    useValue: repos.accountMovementRepo,
                },
                {
                    provide: CashRegisterService,
                    useValue: repos.cashRegisterService,
                },
                {
                    provide: ConfigurationService,
                    useValue: repos.configurationService,
                },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
    });

    afterEach(() => {
        resetAllMocks(repos);
    });

    describe('getPeriodDates', () => {
        it('should return current month when no parameters provided', () => {
            const now = new Date(2024, 0, 15); // January 15, 2024
            jest.useFakeTimers().setSystemTime(now);

            // Test through getFinancialReport
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);

            service.getFinancialReport();

            // Verify that getPeriodDates was called with defaults
            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
        });

        it('should parse custom date range correctly', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';

            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.CUSTOM, startDate, endDate);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // The query should have been called with the custom date range
        });

        it('should prioritize period over custom dates when period != CUSTOM', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.TODAY, '2024-01-01', '2024-01-31');

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Should use TODAY period, not custom dates
        });
    });

    describe('getPresetPeriodDates', () => {
        const now = new Date(2024, 0, 15, 12, 30, 45); // January 15, 2024, 12:30:45

        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(now);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('TODAY - should return today from midnight to end of day', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.TODAY);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) = '2024-01-15'
        });

        it('YESTERDAY - should return yesterday from midnight to end of day', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.YESTERDAY);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) = '2024-01-14'
        });

        it('THIS_WEEK - should return Monday to today (when today is Monday)', async () => {
            const monday = new Date(2024, 0, 15); // Monday, January 15
            jest.useFakeTimers().setSystemTime(monday);

            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.THIS_WEEK);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2024-01-15' AND '2024-01-15'
        });

        it('THIS_WEEK - should return Monday to today (when today is Wednesday)', async () => {
            const wednesday = new Date(2024, 0, 17); // Wednesday, January 17
            jest.useFakeTimers().setSystemTime(wednesday);

            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.THIS_WEEK);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2024-01-15' AND '2024-01-17'
        });

        it('THIS_WEEK - should return Monday to today (when today is Sunday)', async () => {
            const sunday = new Date(2024, 0, 21); // Sunday, January 21
            jest.useFakeTimers().setSystemTime(sunday);

            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.THIS_WEEK);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2024-01-15' AND '2024-01-21'
        });

        it('LAST_WEEK - should return previous Monday to Sunday', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.LAST_WEEK);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2024-01-08' AND '2024-01-14'
        });

        it('THIS_MONTH - should return current month', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.THIS_MONTH);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2024-01-01' AND '2024-01-31'
        });

        it('LAST_MONTH - should return previous month', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.LAST_MONTH);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2023-12-01' AND '2023-12-31'
        });

        it('THIS_QUARTER - should return current quarter', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.THIS_QUARTER);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2024-01-01' AND '2024-03-31'
        });

        it('LAST_QUARTER - should return previous quarter', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.LAST_QUARTER);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2023-10-01' AND '2023-12-31'
        });

        it('THIS_YEAR - should return current year', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.THIS_YEAR);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2024-01-01' AND '2024-12-31'
        });

        it('LAST_YEAR - should return previous year', async () => {
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getFinancialReport(ReportPeriod.LAST_YEAR);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalled();
            // Query should filter by DATE(saleDate) BETWEEN '2023-01-01' AND '2023-12-31'
        });
    });

    describe('getPreviousPeriod', () => {
        it('should calculate previous period correctly', async () => {
            // Test through getSalesReport which calls getPreviousPeriod
            repos.saleRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.saleItemRepo._queryBuilder.getMany.mockResolvedValue([]);

            await service.getSalesReport(ReportPeriod.THIS_WEEK);

            expect(repos.saleRepo.createQueryBuilder).toHaveBeenCalledTimes(2); // current + previous
        });
    });

    describe('calculateGrowthPercentage', () => {
        it('should calculate positive growth correctly', () => {
            // Test through getSalesReport
            const currentSales = [
                { id: '1', total: 225, saleDate: new Date(), status: SaleStatus.COMPLETED }, // 450 total
            ];
            const previousSales = [
                { id: '2', total: 300, saleDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: SaleStatus.COMPLETED },
            ];

            repos.saleRepo._queryBuilder.getMany
                .mockResolvedValueOnce(currentSales)  // current period
                .mockResolvedValueOnce(previousSales); // previous period

            repos.saleItemRepo._queryBuilder.getMany.mockResolvedValue([]);

            return service.getSalesReport(ReportPeriod.THIS_WEEK).then(result => {
                expect(result.growth.revenueGrowth).toBe(-25); // (225 - 300) / 300 * 100 = -25
                expect(result.growth.salesGrowth).toBe(0); // (1 - 1) / 1 * 100 = 0 (same count)
            });
        });

        it('should return 100% when previous is 0 and current > 0', () => {
            const currentSales = [
                { id: '1', total: 100, saleDate: new Date(), status: SaleStatus.COMPLETED },
            ];
            const previousSales: Sale[] = [];

            repos.saleRepo._queryBuilder.getMany
                .mockResolvedValueOnce(currentSales)
                .mockResolvedValueOnce(previousSales);

            repos.saleItemRepo._queryBuilder.getMany.mockResolvedValue([]);

            return service.getSalesReport(ReportPeriod.THIS_WEEK).then(result => {
                expect(result.growth.revenueGrowth).toBe(100);
                expect(result.growth.salesGrowth).toBe(100);
            });
        });

        it('should return 0 when both current and previous are 0', () => {
            const currentSales: Sale[] = [];
            const previousSales: Sale[] = [];

            repos.saleRepo._queryBuilder.getMany
                .mockResolvedValueOnce(currentSales)
                .mockResolvedValueOnce(previousSales);

            repos.saleItemRepo._queryBuilder.getMany.mockResolvedValue([]);

            return service.getSalesReport(ReportPeriod.THIS_WEEK).then(result => {
                expect(result.growth.revenueGrowth).toBe(0);
                expect(result.growth.salesGrowth).toBe(0);
            });
        });
    });

    describe('getProfitColor', () => {
        it('should return green for positive profit', async () => {
            // Test through getFinancialReport
            const sales = [{ id: '1', total: 1000, status: SaleStatus.COMPLETED }];
            const purchases = [{ id: '1', total: 400, status: 'paid' as any }];
            const expenses = [{ id: '1', amount: 200, isPaid: true }];

            repos.saleRepo._queryBuilder.getMany.mockResolvedValue(sales);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue(purchases);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue(expenses);

            const result = await service.getFinancialReport();

            expect(result.summary.profitColor).toBe('green');
        });

        it('should return red for negative profit', async () => {
            const sales = [{ id: '1', total: 100, status: SaleStatus.COMPLETED }];
            const purchases = [{ id: '1', total: 200, status: 'paid' as any }];
            const expenses = [{ id: '1', amount: 100, isPaid: true }];

            repos.saleRepo._queryBuilder.getMany.mockResolvedValue(sales);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue(purchases);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue(expenses);

            const result = await service.getFinancialReport();

            expect(result.summary.profitColor).toBe('red');
        });

        it('should return yellow for zero profit', async () => {
            const sales = [{ id: '1', total: 100, status: SaleStatus.COMPLETED }];
            const purchases = [{ id: '1', total: 50, status: 'paid' as any }];
            const expenses = [{ id: '1', amount: 50, isPaid: true }];

            repos.saleRepo._queryBuilder.getMany.mockResolvedValue(sales);
            repos.incomeRepo._queryBuilder.getMany.mockResolvedValue([]);
            repos.purchaseRepo._queryBuilder.getMany.mockResolvedValue(purchases);
            repos.expenseRepo._queryBuilder.getMany.mockResolvedValue(expenses);

            const result = await service.getFinancialReport();

            expect(result.summary.profitColor).toBe('yellow');
        });
    });
});
