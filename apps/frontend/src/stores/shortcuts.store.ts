import { create } from 'zustand';

/**
 * Tipos de atajos de teclado soportados
 * 
 * Mapeo de teclas F1-F11:
 * - F1: Dashboard (solo navegación)
 * - F2: Ventas + abrir modal nueva venta
 * - F3: Caja (solo navegación)
 * - F4: Cuentas Corrientes (solo navegación)
 * - F5: Ingresos + abrir modal nuevo ingreso
 * - F6: Compras + abrir modal nueva compra
 * - F7: Gastos + abrir modal nuevo gasto
 * - F8: Productos (solo navegación)
 * - F9: Clientes (solo navegación)
 * - F10: Proveedores (solo navegación)
 * - F11: Reportes (solo navegación)
 */
export type ShortcutAction =
    | 'GO_DASHBOARD'        // F1
    | 'NEW_SALE'            // F2 - Ir a Ventas + abrir modal
    | 'GO_CASH'             // F3 - Ir a Caja
    | 'GO_ACCOUNTS'         // F4 - Ir a Cuentas Corrientes
    | 'NEW_INCOME'          // F5 - Ir a Ingresos + abrir modal
    | 'NEW_PURCHASE'        // F6 - Ir a Compras + abrir modal
    | 'NEW_EXPENSE'         // F7 - Ir a Gastos + abrir modal
    | 'GO_PRODUCTS'         // F8 - Ir a Productos
    | 'GO_CUSTOMERS'        // F9 - Ir a Clientes
    | 'GO_SUPPLIERS'        // F10 - Ir a Proveedores
    | 'GO_REPORTS'          // F11 - Ir a Reportes
    | 'SEARCH'              // Ctrl+B
    | 'CLOSE_MODAL'         // Escape
    | null;

interface ShortcutsState {
    /** Atajo actualmente activo (modal a abrir) */
    activeShortcut: ShortcutAction;

    /** Si la búsqueda rápida está abierta */
    isSearchOpen: boolean;

    /** Activa un atajo (abre modal correspondiente) */
    triggerShortcut: (shortcut: ShortcutAction) => void;

    /** Limpia el atajo activo */
    clearShortcut: () => void;

    /** Abre/cierra la búsqueda rápida */
    toggleSearch: () => void;

    /** Cierra la búsqueda rápida */
    closeSearch: () => void;
}

/**
 * Store global para manejar atajos de teclado.
 * Permite que cualquier página reaccione a los atajos.
 */
export const useShortcutsStore = create<ShortcutsState>((set) => ({
    activeShortcut: null,
    isSearchOpen: false,

    triggerShortcut: (shortcut: ShortcutAction) => {
        set({ activeShortcut: shortcut });
    },

    clearShortcut: () => {
        set({ activeShortcut: null });
    },

    toggleSearch: () => {
        set((state) => ({ isSearchOpen: !state.isSearchOpen }));
    },

    closeSearch: () => {
        set({ isSearchOpen: false });
    },
}));

/**
 * Mapeo de teclas a acciones.
 * El hook useKeyboardShortcuts maneja la navegación automática
 * antes de disparar acciones de modal.
 */
export const SHORTCUT_MAP: Record<string, ShortcutAction> = {
    'F1': 'GO_DASHBOARD',
    'F2': 'NEW_SALE',
    'F3': 'GO_CASH',
    'F4': 'GO_ACCOUNTS',
    'F5': 'NEW_INCOME',
    'F6': 'NEW_PURCHASE',
    'F7': 'NEW_EXPENSE',
    'F8': 'GO_PRODUCTS',
    'F9': 'GO_CUSTOMERS',
    'F10': 'GO_SUPPLIERS',
    'F11': 'GO_REPORTS',
};

/**
 * Descripciones amigables de cada atajo (para UI)
 */
export const SHORTCUT_LABELS: Record<ShortcutAction & string, string> = {
    'GO_DASHBOARD': 'Dashboard',
    'NEW_SALE': 'Nueva Venta',
    'GO_CASH': 'Caja',
    'GO_ACCOUNTS': 'Cuentas Corrientes',
    'NEW_INCOME': 'Nuevo Ingreso',
    'NEW_PURCHASE': 'Nueva Compra',
    'NEW_EXPENSE': 'Nuevo Gasto',
    'GO_PRODUCTS': 'Productos',
    'GO_CUSTOMERS': 'Clientes',
    'GO_SUPPLIERS': 'Proveedores',
    'GO_REPORTS': 'Reportes',
    'SEARCH': 'Búsqueda Rápida',
    'CLOSE_MODAL': 'Cerrar',
};

/**
 * Mapeo de acciones a rutas de navegación.
 * Si una acción tiene ruta, el hook navegará automáticamente.
 */
export const ACTION_ROUTES: Record<string, string> = {
    'GO_DASHBOARD': '/dashboard',
    'NEW_SALE': '/sales',
    'GO_CASH': '/cash-register',
    'GO_ACCOUNTS': '/customer-accounts',
    'NEW_INCOME': '/incomes',
    'NEW_PURCHASE': '/purchases',
    'NEW_EXPENSE': '/expenses',
    'GO_PRODUCTS': '/products',
    'GO_CUSTOMERS': '/customers',
    'GO_SUPPLIERS': '/suppliers',
    'GO_REPORTS': '/reports',
};

/**
 * Acciones que abren un modal después de navegar
 */
export const MODAL_ACTIONS: ShortcutAction[] = [
    'NEW_SALE',
    'NEW_INCOME',
    'NEW_PURCHASE',
    'NEW_EXPENSE',
];

