/**
 * Servicio de Reportes
 * Genera análisis financieros y operativos del negocio
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { SalePayment } from '../sales/entities/sale-payment.entity';
import { Purchase, PurchaseStatus } from '../purchases/entities/purchase.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerAccount } from '../customer-accounts/entities/customer-account.entity';
import { ReportPeriod } from './dto';

// ============================================
// INTERFACES PARA REPORTES
// ============================================

export interface RevenueData {
    totalRevenue: number;
    totalSales: number;
    averageTicket: number;
    completedSales: number;
    pendingSales: number;
    cancelledSales: number;
}

export interface CostsData {
    costOfGoodsSold: number;
    totalPurchases: number;
    paidPurchases: number;
    pendingPurchases: number;
}

export interface ExpensesData {
    operatingExpenses: number;
    totalExpenses: number;
    paidExpenses: number;
    pendingExpenses: number;
    byCategory: Array<{
        categoryId: string | null;
        categoryName: string;
        count: number;
        total: number;
        percentage: number;
    }>;
}

export interface ProfitabilityData {
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
    roi: number;
}

export interface FinancialReport {
    period: { startDate: Date; endDate: Date };
    revenue: RevenueData;
    costs: CostsData;
    expenses: ExpensesData;
    profitability: ProfitabilityData;
    summary: {
        totalRevenue: number;
        totalCosts: number;
        netProfit: number;
        profitColor: 'green' | 'red' | 'yellow';
    };
}

export interface SalesReport {
    period: { startDate: Date; endDate: Date };
    current: {
        totalRevenue: number;
        totalSales: number;
        averageTicket: number;
        byPaymentMethod: Array<{
            methodId: string;
            methodName: string;
            total: number;
            count: number;
            percentage: number;
        }>;
        byStatus: Record<string, number>;
    };
    previous: {
        period: { startDate: Date; endDate: Date };
        totalRevenue: number;
        totalSales: number;
        averageTicket: number;
    };
    growth: {
        revenueGrowth: number;
        salesGrowth: number;
        ticketGrowth: number;
    };
    dailyData: Array<{
        date: string;
        revenue: number;
        salesCount: number;
    }>;
}

export interface TopProduct {
    productId: string;
    productName: string;
    productSku: string | null;
    quantitySold: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

export interface ProductsReport {
    period: { startDate: Date; endDate: Date };
    topProducts: TopProduct[];
    lowRotationProducts: Array<{
        productId: string;
        productName: string;
        stock: number;
        lastSaleDate: Date | null;
        daysSinceLastSale: number;
    }>;
    inventory: {
        totalProducts: number;
        productsWithStock: number;
        productsOutOfStock: number;
        productsLowStock: number;
        totalStockValue: number;
        totalSaleValue: number;
    };
}

export interface TopCustomer {
    customerId: string;
    customerName: string;
    email: string | null;
    phone: string | null;
    totalPurchases: number;
    totalAmount: number;
    averageTicket: number;
    lastPurchaseDate: Date;
}

export interface CustomersReport {
    period: { startDate: Date; endDate: Date };
    topCustomers: TopCustomer[];
    accountsStats: {
        totalAccounts: number;
        activeAccounts: number;
        totalDebt: number;
        averageDebt: number;
        overdueAccounts: number;
        topDebtors: Array<{
            customerId: string;
            customerName: string;
            balance: number;
            daysOverdue: number;
        }>;
    };
    newCustomers: number;
    returningCustomers: number;
}

export interface ExpensesReport {
    period: { startDate: Date; endDate: Date };
    current: {
        totalAmount: number;
        totalCount: number;
        byCategory: Array<{
            categoryId: string | null;
            categoryName: string;
            count: number;
            total: number;
            percentage: number;
        }>;
        monthlyTrend: Array<{
            month: string;
            total: number;
        }>;
    };
    previous: {
        period: { startDate: Date; endDate: Date };
        totalAmount: number;
        totalCount: number;
    };
    growth: {
        amountGrowth: number;
        countGrowth: number;
    };
}

export interface CashFlowReport {
    period: { startDate: Date; endDate: Date };
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    byDay: Array<{
        date: string;
        income: number;
        expense: number;
        net: number;
        cumulative: number;
    }>;
}

export interface DashboardSummary {
    today: {
        sales: { revenue: number; count: number };
        expenses: { amount: number; count: number };
        purchases: { amount: number; count: number };
        netCashFlow: number;
    };
    week: {
        sales: { revenue: number; count: number; growth: number };
        expenses: { amount: number; count: number; growth: number };
    };
    month: {
        sales: { revenue: number; count: number; growth: number };
        expenses: { amount: number; count: number; growth: number };
        netProfit: number;
        netMargin: number;
    };
    inventory: {
        totalProducts: number;
        lowStock: number;
        outOfStock: number;
        totalValue: number;
    };
    accounts: {
        totalDebt: number;
        overdueAccounts: number;
    };
}

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Sale)
        private readonly saleRepo: Repository<Sale>,
        @InjectRepository(SaleItem)
        private readonly saleItemRepo: Repository<SaleItem>,
        @InjectRepository(SalePayment)
        private readonly salePaymentRepo: Repository<SalePayment>,
        @InjectRepository(Purchase)
        private readonly purchaseRepo: Repository<Purchase>,
        @InjectRepository(Expense)
        private readonly expenseRepo: Repository<Expense>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Customer)
        private readonly customerRepo: Repository<Customer>,
        @InjectRepository(CustomerAccount)
        private readonly accountRepo: Repository<CustomerAccount>,
    ) {}

    // ============================================
    // HELPERS PARA FECHAS
    // ============================================

    private getPeriodDates(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string
    ): { start: Date; end: Date } {
        const now = new Date();
        let start: Date;
        let end: Date;

        if (period && period !== ReportPeriod.CUSTOM) {
            switch (period) {
                case ReportPeriod.TODAY:
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    break;
                case ReportPeriod.YESTERDAY:
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
                    break;
                case ReportPeriod.THIS_WEEK:
                    const dayOfWeek = now.getDay();
                    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    break;
                case ReportPeriod.LAST_WEEK:
                    const currentDayOfWeek = now.getDay();
                    const diffToLastMonday = currentDayOfWeek === 0 ? 13 : currentDayOfWeek + 6;
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToLastMonday);
                    end = new Date(start.getTime());
                    end.setDate(end.getDate() + 6);
                    end.setHours(23, 59, 59, 999);
                    break;
                case ReportPeriod.THIS_MONTH:
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                case ReportPeriod.LAST_MONTH:
                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                    break;
                case ReportPeriod.THIS_QUARTER:
                    const currentQuarter = Math.floor(now.getMonth() / 3);
                    start = new Date(now.getFullYear(), currentQuarter * 3, 1);
                    end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
                    break;
                case ReportPeriod.LAST_QUARTER:
                    const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
                    const year = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
                    const quarterIndex = lastQuarter < 0 ? 3 : lastQuarter;
                    start = new Date(year, quarterIndex * 3, 1);
                    end = new Date(year, (quarterIndex + 1) * 3, 0, 23, 59, 59, 999);
                    break;
                case ReportPeriod.THIS_YEAR:
                    start = new Date(now.getFullYear(), 0, 1);
                    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
                case ReportPeriod.LAST_YEAR:
                    start = new Date(now.getFullYear() - 1, 0, 1);
                    end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                    break;
                default:
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }
        } else if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Por defecto: mes actual
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        return { start, end };
    }

    private getPreviousPeriod(start: Date, end: Date): { start: Date; end: Date } {
        const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousEnd.setHours(23, 59, 59, 999);
        const previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - periodDays + 1);
        previousStart.setHours(0, 0, 0, 0);
        return { start: previousStart, end: previousEnd };
    }

    // ============================================
    // REPORTE FINANCIERO GENERAL
    // ============================================

    async getFinancialReport(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string
    ): Promise<FinancialReport> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // 1. INGRESOS (Ventas completadas)
        const sales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        const completedSales = sales.filter(s => s.status === SaleStatus.COMPLETED);
        const pendingSales = sales.filter(s => s.status === SaleStatus.PENDING);
        const cancelledSales = sales.filter(s => s.status === SaleStatus.CANCELLED);

        const totalRevenue = completedSales.reduce((sum, s) => sum + Number(s.total), 0);
        const averageTicket = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

        // 2. COSTOS (Compras pagadas)
        const purchases = await this.purchaseRepo
            .createQueryBuilder('purchase')
            .where('purchase.deletedAt IS NULL')
            .andWhere('DATE(purchase.purchaseDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        const paidPurchases = purchases.filter(p => p.status === PurchaseStatus.PAID);
        const pendingPurchases = purchases.filter(p => p.status === PurchaseStatus.PENDING);
        const costOfGoodsSold = paidPurchases.reduce((sum, p) => sum + Number(p.total), 0);

        // 3. GASTOS OPERATIVOS
        const expenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.category', 'category')
            .where('expense.deletedAt IS NULL')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        const paidExpenses = expenses.filter(e => e.isPaid);
        const pendingExpensesArr = expenses.filter(e => !e.isPaid);
        const operatingExpenses = paidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const pendingExpensesAmount = pendingExpensesArr.reduce((sum, e) => sum + Number(e.amount), 0);

        // Agrupar gastos por categoría
        const categoryMap = new Map<string, { name: string; count: number; total: number }>();
        for (const expense of paidExpenses) {
            const categoryId = expense.categoryId ?? 'uncategorized';
            const categoryName = expense.category?.name ?? 'Sin categoría';
            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, { name: categoryName, count: 0, total: 0 });
            }
            const cat = categoryMap.get(categoryId)!;
            cat.count++;
            cat.total += Number(expense.amount);
        }

        const byCategory = Array.from(categoryMap.entries())
            .map(([categoryId, data]) => ({
                categoryId: categoryId === 'uncategorized' ? null : categoryId,
                categoryName: data.name,
                count: data.count,
                total: data.total,
                percentage: operatingExpenses > 0 ? (data.total / operatingExpenses) * 100 : 0,
            }))
            .sort((a, b) => b.total - a.total);

        // 4. CÁLCULOS DE RENTABILIDAD
        const grossProfit = totalRevenue - costOfGoodsSold;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netProfit = grossProfit - operatingExpenses;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const totalCosts = costOfGoodsSold + operatingExpenses;
        const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

        return {
            period: { startDate: start, endDate: end },
            revenue: {
                totalRevenue,
                totalSales: sales.length,
                averageTicket,
                completedSales: completedSales.length,
                pendingSales: pendingSales.length,
                cancelledSales: cancelledSales.length,
            },
            costs: {
                costOfGoodsSold,
                totalPurchases: purchases.length,
                paidPurchases: paidPurchases.length,
                pendingPurchases: pendingPurchases.length,
            },
            expenses: {
                operatingExpenses,
                totalExpenses: expenses.length,
                paidExpenses: paidExpenses.length,
                pendingExpenses: pendingExpensesArr.length,
                byCategory,
            },
            profitability: {
                grossProfit,
                grossMargin,
                netProfit,
                netMargin,
                roi,
            },
            summary: {
                totalRevenue,
                totalCosts,
                netProfit,
                profitColor: netProfit > 0 ? 'green' : netProfit < 0 ? 'red' : 'yellow',
            },
        };
    }

    // ============================================
    // REPORTE DE VENTAS DETALLADO
    // ============================================

    async getSalesReport(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string
    ): Promise<SalesReport> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const { start: prevStart, end: prevEnd } = this.getPreviousPeriod(start, end);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        const prevStartStr = prevStart.toISOString().split('T')[0];
        const prevEndStr = prevEnd.toISOString().split('T')[0];

        // Ventas del período actual
        const currentSales = await this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.payments', 'payments')
            .leftJoinAndSelect('payments.paymentMethod', 'paymentMethod')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .andWhere('sale.status != :cancelled', { cancelled: SaleStatus.CANCELLED })
            .getMany();

        // Ventas del período anterior
        const previousSales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: prevStartStr, end: prevEndStr })
            .andWhere('sale.status != :cancelled', { cancelled: SaleStatus.CANCELLED })
            .getMany();

        // Calcular métricas actuales
        const currentRevenue = currentSales.reduce((sum, s) => sum + Number(s.total), 0);
        const currentCount = currentSales.length;
        const currentAvgTicket = currentCount > 0 ? currentRevenue / currentCount : 0;

        // Calcular métricas anteriores
        const previousRevenue = previousSales.reduce((sum, s) => sum + Number(s.total), 0);
        const previousCount = previousSales.length;
        const previousAvgTicket = previousCount > 0 ? previousRevenue / previousCount : 0;

        // Crecimiento
        const revenueGrowth = previousRevenue > 0 
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
            : currentRevenue > 0 ? 100 : 0;
        const salesGrowth = previousCount > 0 
            ? ((currentCount - previousCount) / previousCount) * 100 
            : currentCount > 0 ? 100 : 0;
        const ticketGrowth = previousAvgTicket > 0 
            ? ((currentAvgTicket - previousAvgTicket) / previousAvgTicket) * 100 
            : currentAvgTicket > 0 ? 100 : 0;

        // Ventas por método de pago
        const paymentMap = new Map<string, { name: string; total: number; count: number }>();
        for (const sale of currentSales) {
            for (const payment of sale.payments || []) {
                const methodId = payment.paymentMethodId ?? 'unknown';
                const methodName = payment.paymentMethod?.name ?? 'Desconocido';
                if (!paymentMap.has(methodId)) {
                    paymentMap.set(methodId, { name: methodName, total: 0, count: 0 });
                }
                const method = paymentMap.get(methodId)!;
                method.total += Number(payment.amount);
                method.count++;
            }
        }

        const byPaymentMethod = Array.from(paymentMap.entries())
            .map(([methodId, data]) => ({
                methodId,
                methodName: data.name,
                total: data.total,
                count: data.count,
                percentage: currentRevenue > 0 ? (data.total / currentRevenue) * 100 : 0,
            }))
            .sort((a, b) => b.total - a.total);

        // Ventas por estado
        const byStatus: Record<string, number> = {};
        for (const sale of currentSales) {
            byStatus[sale.status] = (byStatus[sale.status] || 0) + 1;
        }

        // Datos diarios
        const dailyMap = new Map<string, { revenue: number; count: number }>();
        for (const sale of currentSales) {
            const dateStr = new Date(sale.saleDate).toISOString().split('T')[0];
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, { revenue: 0, count: 0 });
            }
            const day = dailyMap.get(dateStr)!;
            day.revenue += Number(sale.total);
            day.count++;
        }

        const dailyData = Array.from(dailyMap.entries())
            .map(([date, data]) => ({
                date,
                revenue: data.revenue,
                salesCount: data.count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            period: { startDate: start, endDate: end },
            current: {
                totalRevenue: currentRevenue,
                totalSales: currentCount,
                averageTicket: currentAvgTicket,
                byPaymentMethod,
                byStatus,
            },
            previous: {
                period: { startDate: prevStart, endDate: prevEnd },
                totalRevenue: previousRevenue,
                totalSales: previousCount,
                averageTicket: previousAvgTicket,
            },
            growth: {
                revenueGrowth,
                salesGrowth,
                ticketGrowth,
            },
            dailyData,
        };
    }

    // ============================================
    // TOP PRODUCTOS MÁS VENDIDOS
    // ============================================

    async getTopProducts(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string,
        limit: number = 10
    ): Promise<TopProduct[]> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Obtener items de ventas completadas
        const items = await this.saleItemRepo
            .createQueryBuilder('item')
            .innerJoin('item.sale', 'sale')
            .leftJoinAndSelect('item.product', 'product')
            .where('sale.deletedAt IS NULL')
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        // Agrupar por producto
        const productMap = new Map<string, {
            product: Product;
            quantity: number;
            revenue: number;
            cost: number;
        }>();

        for (const item of items) {
            if (!item.product) continue;
            const productId = item.productId;
            if (!productMap.has(productId)) {
                productMap.set(productId, {
                    product: item.product,
                    quantity: 0,
                    revenue: 0,
                    cost: 0,
                });
            }
            const prod = productMap.get(productId)!;
            prod.quantity += item.quantity;
            prod.revenue += Number(item.subtotal);
            prod.cost += item.quantity * Number(item.product.cost);
        }

        // Convertir y ordenar
        const topProducts: TopProduct[] = Array.from(productMap.values())
            .map(data => {
                const profit = data.revenue - data.cost;
                return {
                    productId: data.product.id,
                    productName: data.product.name,
                    productSku: data.product.sku ?? null,
                    quantitySold: data.quantity,
                    revenue: data.revenue,
                    cost: data.cost,
                    profit,
                    margin: data.revenue > 0 ? (profit / data.revenue) * 100 : 0,
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        return topProducts;
    }

    // ============================================
    // REPORTE DE PRODUCTOS
    // ============================================

    async getProductsReport(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string
    ): Promise<ProductsReport> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Top productos
        const topProducts = await this.getTopProducts(period, startDate, endDate, 20);

        // Estadísticas de inventario
        const allProducts = await this.productRepo.find({
            where: { isActive: true },
        });

        const totalProducts = allProducts.length;
        const productsWithStock = allProducts.filter(p => p.stock > 0).length;
        const productsOutOfStock = allProducts.filter(p => p.stock === 0).length;
        const productsLowStock = allProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
        const totalStockValue = allProducts.reduce((sum, p) => sum + (p.stock * Number(p.cost)), 0);
        const totalSaleValue = allProducts.reduce((sum, p) => sum + (p.stock * Number(p.price)), 0);

        // Productos de baja rotación (sin ventas en el período)
        const soldProductIds = new Set(topProducts.map(p => p.productId));
        const lowRotationProducts = allProducts
            .filter(p => !soldProductIds.has(p.id) && p.stock > 0)
            .map(p => ({
                productId: p.id,
                productName: p.name,
                stock: p.stock,
                lastSaleDate: null as Date | null,
                daysSinceLastSale: 0,
            }))
            .slice(0, 20);

        return {
            period: { startDate: start, endDate: end },
            topProducts,
            lowRotationProducts,
            inventory: {
                totalProducts,
                productsWithStock,
                productsOutOfStock,
                productsLowStock,
                totalStockValue: Math.round(totalStockValue * 100) / 100,
                totalSaleValue: Math.round(totalSaleValue * 100) / 100,
            },
        };
    }

    // ============================================
    // TOP CLIENTES
    // ============================================

    async getTopCustomers(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string,
        limit: number = 10
    ): Promise<TopCustomer[]> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const sales = await this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.customer', 'customer')
            .where('sale.deletedAt IS NULL')
            .andWhere('sale.customerId IS NOT NULL')
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        // Agrupar por cliente
        const customerMap = new Map<string, {
            customer: Customer;
            purchases: number;
            amount: number;
            lastDate: Date;
        }>();

        for (const sale of sales) {
            if (!sale.customer) continue;
            const customerId = sale.customerId!;
            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    customer: sale.customer,
                    purchases: 0,
                    amount: 0,
                    lastDate: new Date(sale.saleDate),
                });
            }
            const cust = customerMap.get(customerId)!;
            cust.purchases++;
            cust.amount += Number(sale.total);
            if (new Date(sale.saleDate) > cust.lastDate) {
                cust.lastDate = new Date(sale.saleDate);
            }
        }

        return Array.from(customerMap.values())
            .map(data => ({
                customerId: data.customer.id,
                customerName: `${data.customer.firstName} ${data.customer.lastName}`.trim(),
                email: data.customer.email,
                phone: data.customer.phone,
                totalPurchases: data.purchases,
                totalAmount: data.amount,
                averageTicket: data.purchases > 0 ? data.amount / data.purchases : 0,
                lastPurchaseDate: data.lastDate,
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, limit);
    }

    // ============================================
    // REPORTE DE CLIENTES
    // ============================================

    async getCustomersReport(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string
    ): Promise<CustomersReport> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Top clientes
        const topCustomers = await this.getTopCustomers(period, startDate, endDate, 10);

        // Estadísticas de cuentas corrientes
        const accounts = await this.accountRepo.find({
            relations: ['customer'],
        });

        const activeAccounts = accounts.filter(a => a.status === 'active');
        const totalDebt = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
        const accountsWithDebt = accounts.filter(a => Number(a.balance) > 0);
        const overdueAccounts = accounts.filter(a => a.daysOverdue > 0);

        const topDebtors = accountsWithDebt
            .map(a => ({
                customerId: a.customerId,
                customerName: a.customer 
                    ? `${a.customer.firstName} ${a.customer.lastName}`.trim() 
                    : 'Cliente desconocido',
                balance: Number(a.balance),
                daysOverdue: a.daysOverdue,
            }))
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);

        // Clientes nuevos vs recurrentes
        const salesInPeriod = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('sale.customerId IS NOT NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        const customerIdsInPeriod = new Set(salesInPeriod.map(s => s.customerId));

        // Clientes que compraron antes del período
        const previousSales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('sale.customerId IS NOT NULL')
            .andWhere('DATE(sale.saleDate) < :start', { start: startStr })
            .getMany();

        const previousCustomerIds = new Set(previousSales.map(s => s.customerId));

        let newCustomers = 0;
        let returningCustomers = 0;
        for (const customerId of customerIdsInPeriod) {
            if (previousCustomerIds.has(customerId)) {
                returningCustomers++;
            } else {
                newCustomers++;
            }
        }

        return {
            period: { startDate: start, endDate: end },
            topCustomers,
            accountsStats: {
                totalAccounts: accounts.length,
                activeAccounts: activeAccounts.length,
                totalDebt,
                averageDebt: accountsWithDebt.length > 0 ? totalDebt / accountsWithDebt.length : 0,
                overdueAccounts: overdueAccounts.length,
                topDebtors,
            },
            newCustomers,
            returningCustomers,
        };
    }

    // ============================================
    // REPORTE DE GASTOS
    // ============================================

    async getExpensesReport(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string
    ): Promise<ExpensesReport> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const { start: prevStart, end: prevEnd } = this.getPreviousPeriod(start, end);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        const prevStartStr = prevStart.toISOString().split('T')[0];
        const prevEndStr = prevEnd.toISOString().split('T')[0];

        // Gastos del período actual
        const currentExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.category', 'category')
            .where('expense.deletedAt IS NULL')
            .andWhere('expense.isPaid = true')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        // Gastos del período anterior
        const previousExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('expense.isPaid = true')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: prevStartStr, end: prevEndStr })
            .getMany();

        const currentTotal = currentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const previousTotal = previousExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Gastos por categoría
        const categoryMap = new Map<string, { name: string; count: number; total: number }>();
        for (const expense of currentExpenses) {
            const categoryId = expense.categoryId ?? 'uncategorized';
            const categoryName = expense.category?.name ?? 'Sin categoría';
            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, { name: categoryName, count: 0, total: 0 });
            }
            const cat = categoryMap.get(categoryId)!;
            cat.count++;
            cat.total += Number(expense.amount);
        }

        const byCategory = Array.from(categoryMap.entries())
            .map(([categoryId, data]) => ({
                categoryId: categoryId === 'uncategorized' ? null : categoryId,
                categoryName: data.name,
                count: data.count,
                total: data.total,
                percentage: currentTotal > 0 ? (data.total / currentTotal) * 100 : 0,
            }))
            .sort((a, b) => b.total - a.total);

        // Tendencia mensual (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('expense.isPaid = true')
            .andWhere('expense.expenseDate >= :start', { start: sixMonthsAgo })
            .getMany();

        const monthlyMap = new Map<string, number>();
        for (const expense of monthlyExpenses) {
            const date = new Date(expense.expenseDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + Number(expense.amount));
        }

        const monthlyTrend = Array.from(monthlyMap.entries())
            .map(([month, total]) => ({ month, total }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Crecimiento
        const amountGrowth = previousTotal > 0 
            ? ((currentTotal - previousTotal) / previousTotal) * 100 
            : currentTotal > 0 ? 100 : 0;
        const countGrowth = previousExpenses.length > 0 
            ? ((currentExpenses.length - previousExpenses.length) / previousExpenses.length) * 100 
            : currentExpenses.length > 0 ? 100 : 0;

        return {
            period: { startDate: start, endDate: end },
            current: {
                totalAmount: currentTotal,
                totalCount: currentExpenses.length,
                byCategory,
                monthlyTrend,
            },
            previous: {
                period: { startDate: prevStart, endDate: prevEnd },
                totalAmount: previousTotal,
                totalCount: previousExpenses.length,
            },
            growth: {
                amountGrowth,
                countGrowth,
            },
        };
    }

    // ============================================
    // FLUJO DE CAJA
    // ============================================

    async getCashFlowReport(
        period?: ReportPeriod,
        startDate?: string,
        endDate?: string
    ): Promise<CashFlowReport> {
        const { start, end } = this.getPeriodDates(period, startDate, endDate);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Ingresos (ventas completadas)
        const sales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        // Egresos (compras pagadas + gastos pagados)
        const purchases = await this.purchaseRepo
            .createQueryBuilder('purchase')
            .where('purchase.deletedAt IS NULL')
            .andWhere('purchase.status = :status', { status: PurchaseStatus.PAID })
            .andWhere('DATE(purchase.purchaseDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        const expenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('expense.isPaid = true')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: startStr, end: endStr })
            .getMany();

        // Totales
        const totalIncome = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalExpense = totalPurchases + totalExpenses;
        const netCashFlow = totalIncome - totalExpense;

        // Datos por día
        const dailyMap = new Map<string, { income: number; expense: number }>();

        // Inicializar todos los días del período
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dailyMap.set(dateStr, { income: 0, expense: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Agregar ingresos
        for (const sale of sales) {
            const dateStr = new Date(sale.saleDate).toISOString().split('T')[0];
            if (dailyMap.has(dateStr)) {
                dailyMap.get(dateStr)!.income += Number(sale.total);
            }
        }

        // Agregar egresos de compras
        for (const purchase of purchases) {
            const dateStr = new Date(purchase.purchaseDate).toISOString().split('T')[0];
            if (dailyMap.has(dateStr)) {
                dailyMap.get(dateStr)!.expense += Number(purchase.total);
            }
        }

        // Agregar egresos de gastos
        for (const expense of expenses) {
            const dateStr = new Date(expense.expenseDate).toISOString().split('T')[0];
            if (dailyMap.has(dateStr)) {
                dailyMap.get(dateStr)!.expense += Number(expense.amount);
            }
        }

        // Convertir a array con acumulados
        let cumulative = 0;
        const byDay = Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => {
                const net = data.income - data.expense;
                cumulative += net;
                return {
                    date,
                    income: data.income,
                    expense: data.expense,
                    net,
                    cumulative,
                };
            });

        return {
            period: { startDate: start, endDate: end },
            totalIncome,
            totalExpense,
            netCashFlow,
            byDay,
        };
    }

    // ============================================
    // DASHBOARD RESUMIDO
    // ============================================

    async getDashboardSummary(): Promise<DashboardSummary> {
        const now = new Date();
        
        // Fechas
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const todayStr = todayStart.toISOString().split('T')[0];

        const weekStart = new Date(todayStart);
        const dayOfWeek = weekStart.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(weekStart.getDate() - diffToMonday);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(weekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];
        const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0];

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
        const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];

        // HOY
        const todaySales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) = :date', { date: todayStr })
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .getMany();

        const todayExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('DATE(expense.expenseDate) = :date', { date: todayStr })
            .andWhere('expense.isPaid = true')
            .getMany();

        const todayPurchases = await this.purchaseRepo
            .createQueryBuilder('purchase')
            .where('purchase.deletedAt IS NULL')
            .andWhere('DATE(purchase.purchaseDate) = :date', { date: todayStr })
            .andWhere('purchase.status = :status', { status: PurchaseStatus.PAID })
            .getMany();

        const todaySalesRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
        const todayExpensesAmount = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const todayPurchasesAmount = todayPurchases.reduce((sum, p) => sum + Number(p.total), 0);

        // SEMANA
        const weekSales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: weekStartStr, end: todayStr })
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .getMany();

        const lastWeekSales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: lastWeekStartStr, end: lastWeekEndStr })
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .getMany();

        const weekExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: weekStartStr, end: todayStr })
            .andWhere('expense.isPaid = true')
            .getMany();

        const lastWeekExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: lastWeekStartStr, end: lastWeekEndStr })
            .andWhere('expense.isPaid = true')
            .getMany();

        const weekSalesRevenue = weekSales.reduce((sum, s) => sum + Number(s.total), 0);
        const lastWeekSalesRevenue = lastWeekSales.reduce((sum, s) => sum + Number(s.total), 0);
        const weekExpensesAmount = weekExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const lastWeekExpensesAmount = lastWeekExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // MES
        const monthSales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: monthStartStr, end: monthEndStr })
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .getMany();

        const lastMonthSales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.deletedAt IS NULL')
            .andWhere('DATE(sale.saleDate) BETWEEN :start AND :end', { start: lastMonthStartStr, end: lastMonthEndStr })
            .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
            .getMany();

        const monthExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: monthStartStr, end: monthEndStr })
            .andWhere('expense.isPaid = true')
            .getMany();

        const lastMonthExpenses = await this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.deletedAt IS NULL')
            .andWhere('DATE(expense.expenseDate) BETWEEN :start AND :end', { start: lastMonthStartStr, end: lastMonthEndStr })
            .andWhere('expense.isPaid = true')
            .getMany();

        const monthPurchases = await this.purchaseRepo
            .createQueryBuilder('purchase')
            .where('purchase.deletedAt IS NULL')
            .andWhere('DATE(purchase.purchaseDate) BETWEEN :start AND :end', { start: monthStartStr, end: monthEndStr })
            .andWhere('purchase.status = :status', { status: PurchaseStatus.PAID })
            .getMany();

        const monthSalesRevenue = monthSales.reduce((sum, s) => sum + Number(s.total), 0);
        const lastMonthSalesRevenue = lastMonthSales.reduce((sum, s) => sum + Number(s.total), 0);
        const monthExpensesAmount = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const lastMonthExpensesAmount = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const monthPurchasesAmount = monthPurchases.reduce((sum, p) => sum + Number(p.total), 0);

        const monthNetProfit = monthSalesRevenue - monthPurchasesAmount - monthExpensesAmount;
        const monthNetMargin = monthSalesRevenue > 0 ? (monthNetProfit / monthSalesRevenue) * 100 : 0;

        // INVENTARIO
        const products = await this.productRepo.find({ where: { isActive: true } });
        const totalProducts = products.length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        const totalValue = products.reduce((sum, p) => sum + (p.stock * Number(p.cost)), 0);

        // CUENTAS CORRIENTES
        const accounts = await this.accountRepo.find();
        const totalDebt = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
        const overdueAccounts = accounts.filter(a => a.daysOverdue > 0).length;

        return {
            today: {
                sales: { revenue: todaySalesRevenue, count: todaySales.length },
                expenses: { amount: todayExpensesAmount, count: todayExpenses.length },
                purchases: { amount: todayPurchasesAmount, count: todayPurchases.length },
                netCashFlow: todaySalesRevenue - todayPurchasesAmount - todayExpensesAmount,
            },
            week: {
                sales: { 
                    revenue: weekSalesRevenue, 
                    count: weekSales.length,
                    growth: lastWeekSalesRevenue > 0 
                        ? ((weekSalesRevenue - lastWeekSalesRevenue) / lastWeekSalesRevenue) * 100 
                        : weekSalesRevenue > 0 ? 100 : 0,
                },
                expenses: { 
                    amount: weekExpensesAmount, 
                    count: weekExpenses.length,
                    growth: lastWeekExpensesAmount > 0 
                        ? ((weekExpensesAmount - lastWeekExpensesAmount) / lastWeekExpensesAmount) * 100 
                        : weekExpensesAmount > 0 ? 100 : 0,
                },
            },
            month: {
                sales: { 
                    revenue: monthSalesRevenue, 
                    count: monthSales.length,
                    growth: lastMonthSalesRevenue > 0 
                        ? ((monthSalesRevenue - lastMonthSalesRevenue) / lastMonthSalesRevenue) * 100 
                        : monthSalesRevenue > 0 ? 100 : 0,
                },
                expenses: { 
                    amount: monthExpensesAmount, 
                    count: monthExpenses.length,
                    growth: lastMonthExpensesAmount > 0 
                        ? ((monthExpensesAmount - lastMonthExpensesAmount) / lastMonthExpensesAmount) * 100 
                        : monthExpensesAmount > 0 ? 100 : 0,
                },
                netProfit: monthNetProfit,
                netMargin: monthNetMargin,
            },
            inventory: {
                totalProducts,
                lowStock,
                outOfStock,
                totalValue,
            },
            accounts: {
                totalDebt,
                overdueAccounts,
            },
        };
    }
}
