/**
 * Test Data Factory for Reports Module
 * Creates mock entities for testing
 */
import { Sale, SaleStatus } from '../../../sales/entities/sale.entity';
import { SaleItem } from '../../../sales/entities/sale-item.entity';
import { SalePayment } from '../../../sales/entities/sale-payment.entity';
import { Purchase, PurchaseStatus } from '../../../purchases/entities/purchase.entity';
import { Expense } from '../../../expenses/entities/expense.entity';
import { Income } from '../../../incomes/entities/income.entity';
import { Product } from '../../../products/entities/product.entity';
import { Customer } from '../../../customers/entities/customer.entity';
import { CustomerAccount, AccountStatus } from '../../../customer-accounts/entities/customer-account.entity';
import { AccountMovement, MovementType } from '../../../customer-accounts/entities/account-movement.entity';

// ============================================
// SALE FACTORIES
// ============================================

export function createMockSale(overrides: Partial<Sale> = {}): Sale {
    const sale = new Sale();
    Object.assign(sale, {
        id: `sale-${Math.random().toString(36).substring(7)}`,
        saleNumber: `VENTA-2024-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        customerId: null,
        customerName: null,
        saleDate: new Date(),
        subtotal: 100,
        discount: 0,
        surcharge: 0,
        tax: 0,
        total: 100,
        status: SaleStatus.COMPLETED,
        isOnAccount: false,
        notes: null,
        inventoryUpdated: true,
        isFiscal: false,
        fiscalPending: false,
        ivaPercentage: null,
        fiscalError: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [],
        payments: [],
        customer: undefined,
        ...overrides,
    });
    return sale;
}

export function createMockSaleItem(overrides: Partial<SaleItem> = {}): SaleItem {
    const item = new SaleItem();
    Object.assign(item, {
        id: `item-${Math.random().toString(36).substring(7)}`,
        saleId: 'sale-1',
        productId: 'product-1',
        productCode: 'SKU-001',
        productDescription: 'Test Product',
        quantity: 1,
        unitOfMeasure: 'unidades',
        unitPrice: 100,
        discount: 0,
        discountPercent: 0,
        subtotal: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: createMockProduct(),
        ...overrides,
    });
    return item;
}

export function createMockSalePayment(overrides: Partial<SalePayment> = {}): SalePayment {
    const payment = new SalePayment();
    Object.assign(payment, {
        id: `payment-${Math.random().toString(36).substring(7)}`,
        saleId: 'sale-1',
        paymentMethodId: 'pm-cash',
        amount: 100,
        installments: null,
        cardLastFourDigits: null,
        authorizationCode: null,
        referenceNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentMethod: { id: 'pm-cash', name: 'Efectivo' },
        ...overrides,
    });
    return payment;
}

// ============================================
// PURCHASE FACTORY
// ============================================

export function createMockPurchase(overrides: Partial<Purchase> = {}): Purchase {
    const purchase = new Purchase();
    Object.assign(purchase, {
        id: `purchase-${Math.random().toString(36).substring(7)}`,
        purchaseNumber: `COMP-2024-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        supplierId: null,
        providerName: 'Test Supplier',
        providerDocument: null,
        providerPhone: null,
        purchaseDate: new Date(),
        subtotal: 80,
        tax: 0,
        discount: 0,
        total: 80,
        status: PurchaseStatus.PAID,
        paymentMethodId: null,
        paidAt: new Date(),
        invoiceNumber: null,
        notes: null,
        inventoryUpdated: true,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        ...overrides,
    });
    return purchase;
}

// ============================================
// EXPENSE FACTORY
// ============================================

export function createMockExpense(overrides: Partial<Expense> = {}): Expense {
    const expense = new Expense();
    Object.assign(expense, {
        id: `expense-${Math.random().toString(36).substring(7)}`,
        description: 'Test Expense',
        amount: 50,
        expenseDate: new Date(),
        categoryId: null,
        paymentMethodId: null,
        receiptNumber: null,
        isPaid: true,
        paidAt: new Date(),
        notes: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        category: undefined,
        ...overrides,
    });
    return expense;
}

// ============================================
// INCOME FACTORY
// ============================================

export function createMockIncome(overrides: Partial<Income> = {}): Income {
    const income = new Income();
    Object.assign(income, {
        id: `income-${Math.random().toString(36).substring(7)}`,
        description: 'Test Income',
        amount: 150,
        incomeDate: new Date(),
        categoryId: null,
        customerId: null,
        customerName: null,
        isOnAccount: false,
        paymentMethodId: null,
        receiptNumber: null,
        isPaid: true,
        paidAt: new Date(),
        notes: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        category: undefined,
        ...overrides,
    });
    return income;
}

// ============================================
// PRODUCT FACTORY
// ============================================

export function createMockProduct(overrides: Partial<Product> = {}): Product {
    const product = new Product();
    Object.assign(product, {
        id: `product-${Math.random().toString(36).substring(7)}`,
        name: 'Test Product',
        description: null,
        sku: `SKU-${Math.random().toString(36).substring(7)}`,
        barcode: null,
        cost: 50,
        price: 100,
        profitMargin: 50,
        stock: 10,
        categoryId: null,
        brandId: null,
        useCustomMargin: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });
    return product;
}

// ============================================
// CUSTOMER FACTORY
// ============================================

export function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
    const customer = new Customer();
    Object.assign(customer, {
        id: `customer-${Math.random().toString(36).substring(7)}`,
        firstName: 'John',
        lastName: 'Doe',
        documentType: null,
        ivaCondition: null,
        documentNumber: null,
        email: 'john.doe@example.com',
        phone: '123456789',
        mobile: null,
        address: null,
        city: null,
        state: null,
        postalCode: null,
        categoryId: null,
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });
    return customer;
}

// ============================================
// CUSTOMER ACCOUNT FACTORY
// ============================================

export function createMockCustomerAccount(overrides: Partial<CustomerAccount> = {}): CustomerAccount {
    const account = new CustomerAccount();
    Object.assign(account, {
        id: `account-${Math.random().toString(36).substring(7)}`,
        customerId: 'customer-1',
        balance: 500,
        creditLimit: 1000,
        status: AccountStatus.ACTIVE,
        daysOverdue: 0,
        paymentTermDays: 30,
        lastPaymentDate: null,
        lastPurchaseDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
        customer: createMockCustomer({ id: 'customer-1' }),
        ...overrides,
    });
    return account;
}

// ============================================
// ACCOUNT MOVEMENT FACTORY
// ============================================

export function createMockAccountMovement(overrides: Partial<AccountMovement> = {}): AccountMovement {
    const movement = new AccountMovement();
    Object.assign(movement, {
        id: `movement-${Math.random().toString(36).substring(7)}`,
        accountId: 'account-1',
        movementType: MovementType.PAYMENT,
        amount: -100, // negative for payment
        balanceBefore: 500,
        balanceAfter: 400,
        description: 'Payment received',
        referenceType: 'payment',
        referenceId: null,
        paymentMethodId: null,
        notes: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
        ...overrides,
    });
    return movement;
}

// ============================================
// BATCH FACTORIES (for complex scenarios)
// ============================================

export function createSalesWithPayments(
    count: number,
    options: {
        status?: SaleStatus;
        saleDate?: Date;
        total?: number;
        withCustomer?: boolean;
    } = {}
): Sale[] {
    return Array.from({ length: count }, (_, i) => {
        const total = options.total ?? 100 + i * 10;
        const customer = options.withCustomer ? createMockCustomer({ id: `customer-${i}` }) : undefined;
        
        return createMockSale({
            id: `sale-batch-${i}`,
            total,
            subtotal: total,
            status: options.status ?? SaleStatus.COMPLETED,
            saleDate: options.saleDate ?? new Date(),
            customerId: customer?.id ?? null,
            customer,
            payments: [
                createMockSalePayment({
                    saleId: `sale-batch-${i}`,
                    amount: total,
                }),
            ],
        });
    });
}

export function createExpensesWithCategory(
    count: number,
    options: {
        categoryId?: string;
        categoryName?: string;
        amount?: number;
        expenseDate?: Date;
        isPaid?: boolean;
    } = {}
): Expense[] {
    return Array.from({ length: count }, (_, i) =>
        createMockExpense({
            id: `expense-batch-${i}`,
            amount: options.amount ?? 50 + i * 5,
            expenseDate: options.expenseDate ?? new Date(),
            categoryId: options.categoryId ?? `category-${i % 3}`,
            isPaid: options.isPaid ?? true,
            category: options.categoryId
                ? { id: options.categoryId, name: options.categoryName ?? 'Test Category' }
                : undefined,
        } as Partial<Expense>)
    );
}

export function createProductsWithStock(
    count: number,
    options: {
        lowStockThreshold?: number;
        includeOutOfStock?: boolean;
        includeLowStock?: boolean;
    } = {}
): Product[] {
    const threshold = options.lowStockThreshold ?? 5;
    
    return Array.from({ length: count }, (_, i) => {
        let stock = 10 + i * 2; // Normal stock
        
        if (options.includeOutOfStock && i === 0) {
            stock = 0;
        } else if (options.includeLowStock && i === 1) {
            stock = threshold - 1;
        }
        
        return createMockProduct({
            id: `product-batch-${i}`,
            name: `Product ${i + 1}`,
            stock,
            cost: 50,
            price: 100,
        });
    });
}

// ============================================
// DATE HELPERS FOR TESTS
// ============================================

export function getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function createDateAtMidnight(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function createDateAtEndOfDay(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function daysAgo(days: number, from: Date = new Date()): Date {
    const date = new Date(from);
    date.setDate(date.getDate() - days);
    return date;
}

export function monthsAgo(months: number, from: Date = new Date()): Date {
    const date = new Date(from);
    date.setMonth(date.getMonth() - months);
    return date;
}
