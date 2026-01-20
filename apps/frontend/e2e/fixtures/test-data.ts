/**
 * Datos de prueba centralizados para Playwright E2E
 * Evita duplicación en specs y facilita mantenimiento
 */

// ==================== USUARIO ====================
// Las credenciales deben coincidir con las creadas en el seed del backend (admin / Admin123)
export const E2E_USER = {
  username: process.env.E2E_USERNAME ?? 'admin',
  password: process.env.E2E_PASSWORD ?? 'Admin123',
} as const;

// ==================== CLIENTE ====================
export const E2E_CUSTOMER = {
  firstName: 'Cliente',
  lastName: 'Test E2E',
  phone: '1155660000',
  email: 'cliente.test@example.com',
  documentNumber: '12345678',
} as const;

export const E2E_CUSTOMER_ACCOUNT = {
  firstName: 'Cliente',
  lastName: 'Cuenta',
  phone: '1199988877',
  email: 'cliente.cuenta@example.com',
  documentNumber: '87654321',
} as const;

// ==================== PRODUCTO ====================
export const E2E_PRODUCT = {
  name: 'Producto Test E2E',
  description: 'Producto para tests automatizados',
  cost: 100,
  stock: 50,
} as const;

export const E2E_PRODUCT_SEARCH = {
  searchTerm: 'a', // Término corto para búsqueda
  minResults: 1, // Mínimo de resultados esperados
} as const;

// ==================== VENTA ====================
export const E2E_SALE = {
  productSearch: 'a',
  defaultQuantity: 1,
} as const;

// ==================== CAJA ====================
export const E2E_CASH_REGISTER = {
  initialAmount: 10000,
  openingNotes: 'Apertura automática para tests E2E',
  closeNotes: 'Cierre automático para tests E2E',
  manualMovementDescription: 'Movimiento manual test',
  manualMovementAmount: 1500,
  manualWithdrawalAmount: 500,
} as const;

// ==================== INGRESOS ====================
export const E2E_INCOME = {
  description: 'Ingreso Test E2E',
  amount: 2500,
  category: 'Varios',
} as const;

export const E2E_INCOME_ON_ACCOUNT = {
  description: 'Ingreso a cuenta Test E2E',
  amount: 3500,
  isOnAccount: true,
} as const;

// ==================== GASTOS ====================
export const E2E_EXPENSE = {
  description: 'Gasto Test E2E',
  amount: 1800,
  category: 'Varios',
} as const;

export const E2E_EXPENSE_PENDING = {
  description: 'Gasto pendiente de pago',
  amount: 3200,
  isPaid: false,
} as const;

// ==================== IMPORTES ====================
export const E2E_AMOUNTS = {
  small: 100,
  medium: 1500,
  large: 5000,
  veryLarge: 10000,
} as const;

// ==================== TIMEOUTS ====================
export const E2E_TIMEOUTS = {
  default: 5000,
  navigation: 10000,
  toast: 10000,
  dialog: 5000,
  stable: 1000,
} as const;

// ==================== SELECTORES COMUNES ====================
export const E2E_SELECTORS = {
  toast: '[data-sonner-toast]',
  toastError: '[data-sonner-toast][data-type="error"]',
  dialog: '[role="dialog"]',
  table: 'table',
  loader: '.animate-spin',
  searchInput: '[placeholder*="buscar" i], [placeholder*="search" i]',
} as const;

// ==================== MENSAJES ====================
export const E2E_MESSAGES = {
  success: 'éxito',
  created: 'creado',
  updated: 'actualizado',
  deleted: 'eliminado',
  error: 'error',
  required: 'requerido',
} as const;

// ==================== GENERADORES ====================

/**
 * Genera un identificador único para datos de test
 */
export const generateUniqueId = (prefix: string = 'e2e'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

/**
 * Genera un email único
 */
export const generateTestEmail = (prefix: string = 'test'): string => {
  return `${prefix}_${Date.now()}@example.com`;
};

/**
 * Genera un nombre único
 */
export const generateTestName = (base: string = 'Test'): string => {
  return `${base} ${Date.now()}`;
};
