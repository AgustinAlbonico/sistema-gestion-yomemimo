/**
 * Reports Controller Unit Tests (Smoke Tests)
 * Verifies controller endpoints are properly configured and respond correctly
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from '../reports.controller';
import { ReportsService } from '../reports.service';
import { ReportFiltersDto, TopProductsFiltersDto, TopCustomersFiltersDto, ReportPeriod } from '../dto';

describe('ReportsController', () => {
    let controller: ReportsController;
    let service: jest.Mocked<ReportsService>;

    // Mock service with all methods
    const mockReportsService = {
        getDashboardSummary: jest.fn(),
        getFinancialReport: jest.fn(),
        getSalesReport: jest.fn(),
        getProductsReport: jest.fn(),
        getTopProducts: jest.fn(),
        getCustomersReport: jest.fn(),
        getTopCustomers: jest.fn(),
        getExpensesReport: jest.fn(),
        getCashFlowReport: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReportsController],
            providers: [
                {
                    provide: ReportsService,
                    useValue: mockReportsService,
                },
            ],
        }).compile();

        controller = module.get<ReportsController>(ReportsController);
        service = module.get(ReportsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Controller Setup', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });
    });

    describe('GET /reports/dashboard', () => {
        it('should call getDashboardSummary and return result', async () => {
            const mockResult = {
                today: {
                    sales: { revenue: 1000, count: 10 },
                    expenses: { amount: 200, count: 5 },
                    purchases: { amount: 300, count: 2 },
                    netCashFlow: 500,
                },
                week: {
                    sales: { revenue: 5000, count: 50, growth: 10 },
                    expenses: { amount: 1000, count: 20, growth: -5 },
                },
                month: {
                    sales: { revenue: 20000, count: 200, growth: 15 },
                    expenses: { amount: 4000, count: 80, growth: 5 },
                    netProfit: 10000,
                    netMargin: 50,
                },
                inventory: {
                    totalProducts: 100,
                    lowStock: 5,
                    outOfStock: 2,
                    totalValue: 50000,
                },
                accounts: {
                    totalDebt: 5000,
                    overdueAccounts: 3,
                },
                cashRegister: {
                    isOpen: true,
                    balance: 1500,
                    openedBy: 'Admin',
                    openedAt: new Date(),
                },
                charts: { last7Days: [] },
                topProducts: [],
                alerts: {
                    cashClosed: false,
                    lowStockCount: 5,
                    outOfStockCount: 2,
                    overdueAccountsCount: 3,
                },
            };

            mockReportsService.getDashboardSummary.mockResolvedValue(mockResult);

            const result = await controller.getDashboardSummary();

            expect(service.getDashboardSummary).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockResult);
        });
    });

    describe('GET /reports/financial', () => {
        it('should call getFinancialReport with filters', async () => {
            const filters: ReportFiltersDto = {
                period: ReportPeriod.THIS_MONTH,
            };
            const mockResult = {
                period: { startDate: new Date(), endDate: new Date() },
                revenue: { totalRevenue: 10000, totalSales: 50, averageTicket: 200, completedSales: 45, pendingSales: 5, cancelledSales: 0 },
                incomes: { totalServiceIncome: 2000, totalIncomes: 10, paidIncomes: 8, pendingIncomes: 2, byCategory: [] },
                costs: { costOfGoodsSold: 5000, totalPurchases: 20, paidPurchases: 18, pendingPurchases: 2 },
                expenses: { operatingExpenses: 2000, totalExpenses: 30, paidExpenses: 28, pendingExpenses: 2, byCategory: [] },
                profitability: { grossProfit: 5000, grossMargin: 50, netProfit: 3000, netMargin: 30, roi: 60 },
                summary: { totalRevenue: 12000, totalServiceIncome: 2000, totalCosts: 7000, netProfit: 3000, profitColor: 'green' as const },
            };

            mockReportsService.getFinancialReport.mockResolvedValue(mockResult);

            const result = await controller.getFinancialReport(filters);

            expect(service.getFinancialReport).toHaveBeenCalledWith(
                ReportPeriod.THIS_MONTH,
                undefined,
                undefined
            );
            expect(result).toEqual(mockResult);
        });

        it('should pass custom date range to service', async () => {
            const filters: ReportFiltersDto = {
                period: ReportPeriod.CUSTOM,
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            };

            mockReportsService.getFinancialReport.mockResolvedValue({} as ReturnType<typeof service.getFinancialReport>);

            await controller.getFinancialReport(filters);

            expect(service.getFinancialReport).toHaveBeenCalledWith(
                ReportPeriod.CUSTOM,
                '2024-01-01',
                '2024-01-31'
            );
        });
    });

    describe('GET /reports/sales', () => {
        it('should call getSalesReport with filters', async () => {
            const filters: ReportFiltersDto = {
                period: ReportPeriod.THIS_WEEK,
            };
            const mockResult = {
                period: { startDate: new Date(), endDate: new Date() },
                current: { totalRevenue: 5000, totalSales: 25, averageTicket: 200, byPaymentMethod: [], byStatus: {} },
                previous: { period: { startDate: new Date(), endDate: new Date() }, totalRevenue: 4000, totalSales: 20, averageTicket: 200 },
                growth: { revenueGrowth: 25, salesGrowth: 25, ticketGrowth: 0 },
                dailyData: [],
            };

            mockReportsService.getSalesReport.mockResolvedValue(mockResult);

            const result = await controller.getSalesReport(filters);

            expect(service.getSalesReport).toHaveBeenCalledWith(
                ReportPeriod.THIS_WEEK,
                undefined,
                undefined
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('GET /reports/products', () => {
        it('should call getProductsReport with filters', async () => {
            const filters: ReportFiltersDto = {
                period: ReportPeriod.THIS_MONTH,
            };
            const mockResult = {
                period: { startDate: new Date(), endDate: new Date() },
                topProducts: [],
                lowRotationProducts: [],
                inventory: {
                    totalProducts: 100,
                    productsWithStock: 90,
                    productsOutOfStock: 10,
                    productsLowStock: 5,
                    totalStockValue: 50000,
                    totalSaleValue: 100000,
                },
            };

            mockReportsService.getProductsReport.mockResolvedValue(mockResult);

            const result = await controller.getProductsReport(filters);

            expect(service.getProductsReport).toHaveBeenCalledWith(
                ReportPeriod.THIS_MONTH,
                undefined,
                undefined
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('GET /reports/top-products', () => {
        it('should call getTopProducts with filters and limit', async () => {
            const filters: TopProductsFiltersDto = {
                period: ReportPeriod.THIS_MONTH,
                limit: 5,
            };
            const mockResult = [
                { productId: '1', productName: 'Product 1', productSku: 'SKU-1', quantitySold: 100, revenue: 10000, cost: 5000, profit: 5000, margin: 50 },
            ];

            mockReportsService.getTopProducts.mockResolvedValue(mockResult);

            const result = await controller.getTopProducts(filters);

            expect(service.getTopProducts).toHaveBeenCalledWith(
                ReportPeriod.THIS_MONTH,
                undefined,
                undefined,
                5
            );
            expect(result).toEqual(mockResult);
        });

        it('should use default limit when not specified', async () => {
            const filters: TopProductsFiltersDto = {
                period: ReportPeriod.THIS_MONTH,
            };

            mockReportsService.getTopProducts.mockResolvedValue([]);

            await controller.getTopProducts(filters);

            expect(service.getTopProducts).toHaveBeenCalledWith(
                ReportPeriod.THIS_MONTH,
                undefined,
                undefined,
                undefined
            );
        });
    });

    describe('GET /reports/customers', () => {
        it('should call getCustomersReport with filters', async () => {
            const filters: ReportFiltersDto = {
                period: ReportPeriod.THIS_MONTH,
            };
            const mockResult = {
                period: { startDate: new Date(), endDate: new Date() },
                topCustomers: [],
                accountsStats: {
                    totalAccounts: 50,
                    activeAccounts: 45,
                    totalDebt: 10000,
                    averageDebt: 200,
                    overdueAccounts: 5,
                    topDebtors: [],
                },
                newCustomers: 10,
                returningCustomers: 40,
            };

            mockReportsService.getCustomersReport.mockResolvedValue(mockResult);

            const result = await controller.getCustomersReport(filters);

            expect(service.getCustomersReport).toHaveBeenCalledWith(
                ReportPeriod.THIS_MONTH,
                undefined,
                undefined
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('GET /reports/top-customers', () => {
        it('should call getTopCustomers with filters and limit', async () => {
            const filters: TopCustomersFiltersDto = {
                period: ReportPeriod.THIS_MONTH,
                limit: 10,
            };
            const mockResult = [
                { customerId: '1', customerName: 'John Doe', email: 'john@example.com', phone: '123', totalPurchases: 20, totalAmount: 5000, averageTicket: 250, lastPurchaseDate: new Date() },
            ];

            mockReportsService.getTopCustomers.mockResolvedValue(mockResult);

            const result = await controller.getTopCustomers(filters);

            expect(service.getTopCustomers).toHaveBeenCalledWith(
                ReportPeriod.THIS_MONTH,
                undefined,
                undefined,
                10
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('GET /reports/expenses', () => {
        it('should call getExpensesReport with filters', async () => {
            const filters: ReportFiltersDto = {
                period: ReportPeriod.LAST_MONTH,
            };
            const mockResult = {
                period: { startDate: new Date(), endDate: new Date() },
                current: { totalAmount: 5000, totalCount: 50, byCategory: [], monthlyTrend: [] },
                previous: { period: { startDate: new Date(), endDate: new Date() }, totalAmount: 4500, totalCount: 45 },
                growth: { amountGrowth: 11.1, countGrowth: 11.1 },
            };

            mockReportsService.getExpensesReport.mockResolvedValue(mockResult);

            const result = await controller.getExpensesReport(filters);

            expect(service.getExpensesReport).toHaveBeenCalledWith(
                ReportPeriod.LAST_MONTH,
                undefined,
                undefined
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('GET /reports/cash-flow', () => {
        it('should call getCashFlowReport with filters', async () => {
            const filters: ReportFiltersDto = {
                period: ReportPeriod.THIS_MONTH,
            };
            const mockResult = {
                period: { startDate: new Date(), endDate: new Date() },
                totalIncome: 20000,
                totalExpense: 15000,
                netCashFlow: 5000,
                byDay: [],
            };

            mockReportsService.getCashFlowReport.mockResolvedValue(mockResult);

            const result = await controller.getCashFlowReport(filters);

            expect(service.getCashFlowReport).toHaveBeenCalledWith(
                ReportPeriod.THIS_MONTH,
                undefined,
                undefined
            );
            expect(result).toEqual(mockResult);
        });
    });
});
