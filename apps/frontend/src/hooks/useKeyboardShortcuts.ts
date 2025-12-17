import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    useShortcutsStore,
    SHORTCUT_MAP,
    ACTION_ROUTES,
    MODAL_ACTIONS,
    ShortcutAction
} from '../stores/shortcuts.store';
import { useAuthStore } from '../stores/auth.store';

/**
 * Hook global que escucha atajos de teclado y dispara acciones.
 * 
 * Flujo de cada atajo:
 * 1. Si tiene ruta asociada (ACTION_ROUTES), primero navega a esa ruta
 * 2. Si es una acción de modal (MODAL_ACTIONS), espera a llegar y dispara el shortcut
 * 3. Las páginas usan useShortcutAction() para escuchar y abrir sus modales
 * 
 * Mapeo F1-F11:
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
 * - Ctrl+B: Búsqueda rápida
 * - Escape: Cerrar modal activo
 */
export function useKeyboardShortcuts(): void {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();
    const {
        triggerShortcut,
        clearShortcut,
        toggleSearch,
        closeSearch,
        activeShortcut,
        isSearchOpen
    } = useShortcutsStore();

    useEffect(() => {
        // No activar atajos si no está autenticado o está en login
        if (!isAuthenticated || location.pathname === '/login') {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            // No procesar si hay un input/textarea enfocado (excepto para Escape)
            const target = event.target as HTMLElement;
            const isInputFocused =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Escape siempre funciona para cerrar modales
            if (event.key === 'Escape') {
                if (isSearchOpen) {
                    event.preventDefault();
                    closeSearch();
                    return;
                }
                if (activeShortcut) {
                    event.preventDefault();
                    clearShortcut();
                    return;
                }
                // Dejar que Escape cierre otros modales normalmente
                return;
            }

            // No procesar otros atajos si hay input enfocado
            if (isInputFocused) {
                return;
            }

            // Ctrl+B o Cmd+B para búsqueda rápida
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
                event.preventDefault();
                toggleSearch();
                return;
            }

            // Procesar teclas F1-F11
            const shortcutAction = SHORTCUT_MAP[event.key] as ShortcutAction | undefined;

            if (shortcutAction) {
                event.preventDefault();

                // Obtener la ruta asociada a esta acción
                const targetRoute = ACTION_ROUTES[shortcutAction];
                const currentPath = location.pathname;
                const isModalAction = MODAL_ACTIONS.includes(shortcutAction);

                // Si ya estamos en la ruta correcta
                if (targetRoute && currentPath === targetRoute) {
                    // Si es acción de modal, disparar el shortcut inmediatamente
                    if (isModalAction) {
                        triggerShortcut(shortcutAction);
                    }
                    // Si solo es navegación, ya estamos ahí, no hacer nada
                    return;
                }

                // Si necesitamos navegar a otra ruta
                if (targetRoute) {
                    // Navegar primero
                    navigate(targetRoute);

                    // Si es acción de modal, disparar el shortcut después de un pequeño delay
                    // para dar tiempo a que la página se monte
                    if (isModalAction) {
                        setTimeout(() => {
                            triggerShortcut(shortcutAction);
                        }, 100);
                    }
                }
            }
        };

        // Agregar listener
        window.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        isAuthenticated,
        location.pathname,
        triggerShortcut,
        clearShortcut,
        toggleSearch,
        closeSearch,
        navigate,
        activeShortcut,
        isSearchOpen,
    ]);
}

/**
 * Hook para escuchar un atajo específico en un componente.
 * Cuando el atajo se activa, ejecuta el callback y limpia el atajo.
 * 
 * @param shortcut - El atajo a escuchar (ej: 'NEW_SALE')
 * @param callback - Función a ejecutar cuando se activa el atajo
 */
export function useShortcutAction(
    shortcut: ShortcutAction,
    callback: () => void
): void {
    const { activeShortcut, clearShortcut } = useShortcutsStore();

    useEffect(() => {
        if (activeShortcut === shortcut) {
            callback();
            clearShortcut();
        }
    }, [activeShortcut, shortcut, callback, clearShortcut]);
}

