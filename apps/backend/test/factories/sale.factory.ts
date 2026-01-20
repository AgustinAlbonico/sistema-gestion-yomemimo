/**
 * Factory para crear ventas de prueba
 * Soporta todos los campos de CreateSaleDto
 */

import { SaleStatus } from '../../src/modules/sales/entities/sale.entity';
import type { CreateSaleDto, CreateSaleItemDto, CreateSalePaymentDto, CreateSaleTaxDto } from '../../src/modules/sales';

/**
 * DTO para crear un item de venta
 */
export interface SaleItemDTO {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    discountPercent?: number;
    notes?: string;
}

/**
 * DTO para crear un pago de venta
 */
export interface SalePaymentDTO {
    paymentMethodId: string;
    amount: number;
    installments?: number;
    cardLastFourDigits?: string;
    authorizationCode?: string;
    referenceNumber?: string;
    notes?: string;
}

/**
 * DTO para crear un impuesto de venta
 */
export interface SaleTaxDTO {
    name: string;
    percentage?: number;
    amount: number;
}

/**
 * DTO completo para crear una venta
 */
export interface SaleDTO {
    customerId?: string | null;
    customerName?: string;
    saleDate?: string;
    discount?: number;
    surcharge?: number;
    tax?: number;
    taxes?: SaleTaxDTO[];
    status?: SaleStatus;
    isOnAccount?: boolean;
    generateInvoice?: boolean;
    ivaPercentage?: number;
    notes?: string;
    items: SaleItemDTO[];
    payments?: SalePaymentDTO[];
}

let saleCounter = 0;
let paymentCounter = 0;

/**
 * Crea un item de venta con valores por defecto
 */
export const createSaleItemDTO = (
    productId: string,
    overrides: Partial<SaleItemDTO> = {},
): SaleItemDTO => ({
    productId,
    quantity: 1,
    unitPrice: 100,
    discount: 0,
    discountPercent: 0,
    notes: undefined,
    ...overrides,
});

/**
 * Crea un pago de venta con valores por defecto
 */
export const createSalePaymentDTO = (
    paymentMethodId: string,
    amount: number,
    overrides: Partial<SalePaymentDTO> = {},
): SalePaymentDTO => ({
    paymentMethodId,
    amount,
    installments: 1,
    cardLastFourDigits: undefined,
    authorizationCode: undefined,
    referenceNumber: undefined,
    notes: undefined,
    ...overrides,
});

/**
 * Crea un impuesto de venta con valores por defecto
 */
export const createSaleTaxDTO = (
    name: string,
    amount: number,
    overrides: Partial<SaleTaxDTO> = {},
): SaleTaxDTO => ({
    name,
    percentage: undefined,
    amount,
    ...overrides,
});

/**
 * Crea un impuesto de IVA con porcentaje
 */
export const createIvaTaxDTO = (
    percentage: 21 | 10.5 | 27,
    amount: number,
): SaleTaxDTO => ({
    name: `IVA ${percentage}%`,
    percentage,
    amount,
});

/**
 * Crea una venta completa con todos los campos opcionales
 */
export const createSaleDTO = (
    items: SaleItemDTO[],
    overrides: Partial<Omit<SaleDTO, 'items'>> = {},
): SaleDTO => {
    saleCounter += 1;
    return {
        customerId: null,
        customerName: `Cliente Test ${saleCounter}`,
        saleDate: undefined,
        discount: 0,
        surcharge: 0,
        tax: 0,
        taxes: undefined,
        status: undefined,
        isOnAccount: false,
        generateInvoice: false,
        ivaPercentage: undefined,
        notes: '',
        payments: undefined,
        ...overrides,
        items,
    };
};

/**
 * Crea una venta completada (pagada) con un solo item
 */
export const createCompletedSaleDTO = (
    productId: string,
    overrides: Partial<SaleDTO> = {},
): SaleDTO => {
    const item = createSaleItemDTO(productId);
    const total = item.quantity * item.unitPrice - (item.discount || 0);

    return createSaleDTO([item], {
        status: SaleStatus.COMPLETED,
        isOnAccount: false,
        payments: [createSalePaymentDTO('cash-payment-method', total)],
        ...overrides,
    });
};

/**
 * Crea una venta pendiente (cuenta corriente)
 */
export const createPendingSaleDTO = (
    productId: string,
    customerId?: string,
    overrides: Partial<SaleDTO> = {},
): SaleDTO => {
    const item = createSaleItemDTO(productId);

    return createSaleDTO([item], {
        customerId: customerId || null,
        customerName: `Cliente CC ${saleCounter}`,
        status: SaleStatus.PENDING,
        isOnAccount: true,
        payments: [],
        ...overrides,
    });
};

/**
 * Crea una venta con impuestos
 */
export const createSaleWithTaxesDTO = (
    items: SaleItemDTO[],
    taxes: SaleTaxDTO[],
    overrides: Partial<SaleDTO> = {},
): SaleDTO => {
    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
        0
    );
    const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + totalTax;

    return createSaleDTO(items, {
        taxes,
        tax: totalTax,
        payments: [createSalePaymentDTO('cash-payment-method', total)],
        ...overrides,
    });
};

/**
 * Crea una venta con múltiples pagos
 */
export const createSaleWithMultiplePaymentsDTO = (
    items: SaleItemDTO[],
    payments: Omit<SalePaymentDTO, 'paymentMethodId'>[],
    paymentMethodIds: string[],
): SaleDTO => {
    const total = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
        0
    );

    const salePayments: SalePaymentDTO[] = payments.map((payment, index) => ({
        ...payment,
        paymentMethodId: paymentMethodIds[index] || `payment-method-${index}`,
    }));

    return createSaleDTO(items, {
        payments: salePayments,
    });
};

/**
 * Crea una venta con descuentos por item
 */
export const createSaleWithItemDiscountsDTO = (
    itemsWithDiscounts: Array<{ productId: string; quantity: number; unitPrice: number; discount: number }>,
): SaleDTO => {
    const items: SaleItemDTO[] = itemsWithDiscounts.map(item => ({
        ...item,
        discountPercent: 0,
        notes: undefined,
    }));

    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
        0
    );

    return createSaleDTO(items, {
        payments: [createSalePaymentDTO('cash-payment-method', subtotal)],
    });
};

/**
 * Crea una venta para facturar (con datos fiscales)
 */
export const createTaxableSaleDTO = (
    productId: string,
    ivaPercentage: 21 | 10.5 | 27 = 21,
    overrides: Partial<SaleDTO> = {},
): SaleDTO => {
    const item = createSaleItemDTO(productId);
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = subtotal * (ivaPercentage / 100);
    const total = subtotal + taxAmount;

    return createSaleDTO([item], {
        ivaPercentage,
        taxes: [createIvaTaxDTO(ivaPercentage, taxAmount)],
        tax: taxAmount,
        generateInvoice: true,
        payments: [createSalePaymentDTO('cash-payment-method', total)],
        ...overrides,
    });
};

/**
 * Genera un ID único para pagos
 */
export const generatePaymentId = (): string => {
    paymentCounter += 1;
    return `payment-${paymentCounter}-${Date.now()}`;
};

/**
 * Genera un ID único para items
 */
export const generateItemId = (): string => {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Reset de los contadores
 */
export const resetSaleCounter = () => {
    saleCounter = 0;
    paymentCounter = 0;
};

/**
 * Helpers para crear estados de venta específicos
 */
export const SaleFactoryHelpers = {
    /**
     * Crea una venta cancelada
     */
    cancelled: (productId: string, overrides: Partial<SaleDTO> = {}): SaleDTO => {
        return createSaleDTO([createSaleItemDTO(productId)], {
            status: SaleStatus.CANCELLED,
            ...overrides,
        });
    },

    /**
     * Crea una venta parcialmente pagada
     */
    partial: (productId: string, overrides: Partial<SaleDTO> = {}): SaleDTO => {
        const item = createSaleItemDTO(productId, { quantity: 2, unitPrice: 100 });
        const total = item.quantity * item.unitPrice;

        return createSaleDTO([item], {
            status: SaleStatus.PARTIAL,
            payments: [
                createSalePaymentDTO('cash-payment-method', total * 0.5),
            ],
            ...overrides,
        });
    },

    /**
     * Crea una venta con recargo
     */
    withSurcharge: (productId: string, surcharge: number, overrides: Partial<SaleDTO> = {}): SaleDTO => {
        const item = createSaleItemDTO(productId);
        const subtotal = item.quantity * item.unitPrice;
        const total = subtotal + surcharge;

        return createSaleDTO([item], {
            surcharge,
            payments: [createSalePaymentDTO('cash-payment-method', total)],
            ...overrides,
        });
    },

    /**
     * Crea una venta con descuento global
     */
    withDiscount: (productId: string, discount: number, overrides: Partial<SaleDTO> = {}): SaleDTO => {
        const item = createSaleItemDTO(productId);
        const subtotal = item.quantity * item.unitPrice;
        const total = subtotal - discount;

        return createSaleDTO([item], {
            discount,
            payments: [createSalePaymentDTO('cash-payment-method', total)],
            ...overrides,
        });
    },

    /**
     * Crea una venta con nota
     */
    withNotes: (productId: string, notes: string, overrides: Partial<SaleDTO> = {}): SaleDTO => {
        return createSaleDTO([createSaleItemDTO(productId)], {
            notes,
            payments: [createSalePaymentDTO('cash-payment-method', 100)],
            ...overrides,
        });
    },

    /**
     * Crea una venta con fecha específica
     */
    withDate: (productId: string, saleDate: string, overrides: Partial<SaleDTO> = {}): SaleDTO => {
        return createSaleDTO([createSaleItemDTO(productId)], {
            saleDate,
            payments: [createSalePaymentDTO('cash-payment-method', 100)],
            ...overrides,
        });
    },

    /**
     * Crea una venta con cliente específico
     */
    withCustomer: (
        productId: string,
        customerId: string,
        customerName: string,
        overrides: Partial<SaleDTO> = {}
    ): SaleDTO => {
        return createSaleDTO([createSaleItemDTO(productId)], {
            customerId,
            customerName,
            payments: [createSalePaymentDTO('cash-payment-method', 100)],
            ...overrides,
        });
    },

    /**
     * Crea una venta con multiple items
     */
    withMultipleItems: (
        items: Array<{ productId: string; quantity?: number; unitPrice?: number; discount?: number }>,
        overrides: Partial<SaleDTO> = {}
    ): SaleDTO => {
        const saleItems: SaleItemDTO[] = items.map(item =>
            createSaleItemDTO(item.productId, {
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice ?? 100,
                discount: item.discount ?? 0,
            })
        );

        const total = saleItems.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
            0
        );

        return createSaleDTO(saleItems, {
            payments: [createSalePaymentDTO('cash-payment-method', total)],
            ...overrides,
        });
    },
};

/**
 * Exportar todos los helpers como valores individuales para facilitar su uso
 */
export const {
    cancelled,
    partial,
    withSurcharge,
    withDiscount,
    withNotes,
    withDate,
    withCustomer,
    withMultipleItems,
} = SaleFactoryHelpers;
