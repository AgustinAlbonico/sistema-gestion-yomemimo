/**
 * Factory para crear ventas de prueba
 */

export interface SaleItemDTO {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
}

export interface SaleDTO {
    customerId?: string | null;
    customerName?: string;
    items: SaleItemDTO[];
    paymentMethodId?: string;
    notes?: string;
}

let saleCounter = 0;

/**
 * Crea un item de venta
 */
export const createSaleItemDTO = (
    productId: string,
    overrides: Partial<SaleItemDTO> = {}
): SaleItemDTO => ({
    productId,
    quantity: 1,
    unitPrice: 100,
    discount: 0,
    ...overrides,
});

/**
 * Crea una venta completa
 */
export const createSaleDTO = (
    items: SaleItemDTO[],
    overrides: Partial<Omit<SaleDTO, 'items'>> = {}
): SaleDTO => {
    saleCounter++;
    return {
        customerId: null,
        customerName: `Cliente Test ${saleCounter}`,
        items,
        notes: '',
        ...overrides,
    };
};

/**
 * Reset del contador
 */
export const resetSaleCounter = () => {
    saleCounter = 0;
};
