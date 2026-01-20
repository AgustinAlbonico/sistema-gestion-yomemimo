/**
 * Factory para mocks de Sale completo
 */
import { Sale, SaleStatus } from '../../../src/modules/sales/entities/sale.entity';
import { SaleItem } from '../../../src/modules/sales/entities/sale-item.entity';
import { SalePayment } from '../../../src/modules/sales/entities/sale-payment.entity';
import { Invoice } from '../../../src/modules/sales/entities/invoice.entity';
import { User } from '../../../src/modules/auth/entities/user.entity';

/**
 * Crea un mock mínimo de Sale válido con todas las propiedades obligatorias
 */
export const createMockSale = (overrides: Partial<Sale> = {}): Sale => {
  const now = new Date();

  const mockSale: Partial<Sale> = {
    id: 'sale-1',
    saleNumber: 'VENTA-2026-00001',
    status: SaleStatus.COMPLETED,
    saleDate: now,
    subtotal: 0,
    discount: 0,
    surcharge: 0,
    tax: 0,
    total: 0,
    isOnAccount: false,
    inventoryUpdated: false,
    isFiscal: false,
    fiscalPending: false,
    ivaPercentage: null,
    fiscalError: null,
    notes: null,
    customerId: null,
    customerName: null,
    ...overrides,
  };

  // Crear mocks para relaciones (solo las necesarias)
  if (!overrides.customer) {
    mockSale.customer = null;
  }

  if (!overrides.createdBy) {
    mockSale.createdBy = null;
  }

  if (!overrides.invoice) {
    mockSale.invoice = null;
  }

  return mockSale as Sale;
};

/**
 * Crea un mock de SaleItem con propiedades mínimas
 */
export const createMockSaleItem = (overrides: Partial<SaleItem> = {}): SaleItem => {
  const mockItem: Partial<SaleItem> = {
    id: 'item-1',
    quantity: 1,
    unitPrice: 100,
    discount: 0,
    discountPercent: 0,
    subtotal: 100,
    saleId: 'sale-1',
    ...overrides,
  };

  // Relaciones (mock)
  if (!overrides.sale) {
    mockItem.sale = {} as Sale;
  }

  return mockItem as SaleItem;
};

/**
 * Crea un mock de SalePayment con propiedades mínimas
 */
export const createMockSalePayment = (overrides: Partial<SalePayment> = {}): SalePayment => {
  const mockPayment: Partial<SalePayment> = {
    id: 'payment-1',
    amount: 100,
    saleId: 'sale-1',
    ...overrides,
  };

  // Relaciones (mock)
  if (!overrides.sale) {
    mockPayment.sale = {} as Sale;
  }

  return mockPayment as SalePayment;
};
