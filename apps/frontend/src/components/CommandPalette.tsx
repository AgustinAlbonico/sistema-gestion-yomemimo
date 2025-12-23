import { useNavigate } from 'react-router-dom';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    useShortcutsStore,
    SHORTCUT_MAP,
    SHORTCUT_LABELS,
    ACTION_ROUTES,
    MODAL_ACTIONS,
    ShortcutAction
} from '../stores/shortcuts.store';
import {
    ShoppingCart,
    Receipt,
    Package,
    Users,
    Truck,
    TrendingUp,
    CreditCard,
    Wallet,
    LayoutDashboard,
    BarChart3,
    Settings,
} from 'lucide-react';

// Iconos para cada acción
const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    GO_DASHBOARD: LayoutDashboard,
    NEW_SALE: ShoppingCart,
    GO_CASH: Wallet,
    GO_ACCOUNTS: CreditCard,
    NEW_INCOME: TrendingUp,
    NEW_PURCHASE: Package,
    NEW_EXPENSE: Receipt,
    GO_PRODUCTS: Package,
    GO_CUSTOMERS: Users,
    GO_SUPPLIERS: Truck,
    GO_REPORTS: BarChart3,
};

/**
 * Paleta de comandos (Command Palette) similar a VS Code / Spotlight.
 * Se abre con Ctrl+B o Cmd+B.
 * Permite buscar y ejecutar acciones rápidamente.
 */
export function CommandPalette() {
    const navigate = useNavigate();
    const { isSearchOpen, closeSearch, triggerShortcut } = useShortcutsStore();

    const handleSelect = (action: ShortcutAction) => {
        if (!action) return;

        closeSearch();

        // Obtener ruta asociada
        const targetRoute = ACTION_ROUTES[action];
        const isModalAction = MODAL_ACTIONS.includes(action);

        if (targetRoute) {
            // Navegar a la ruta
            navigate(targetRoute);

            // Si es acción de modal, disparar después de un pequeño delay
            if (isModalAction) {
                setTimeout(() => {
                    triggerShortcut(action);
                }, 100);
            }
        }
    };

    return (
        <CommandDialog open={isSearchOpen} onOpenChange={(open) => !open && closeSearch()}>
            <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="Buscar acción... (ej: venta, cliente, producto)" />
                <CommandList>
                    <CommandEmpty>No se encontraron acciones.</CommandEmpty>

                    <CommandGroup heading="Atajos Rápidos (F1-F11)">
                        {Object.entries(SHORTCUT_MAP).map(([key, action]) => {
                            if (!action) return null;
                            const Icon = ACTION_ICONS[action] || LayoutDashboard;
                            const label = SHORTCUT_LABELS[action];

                            return (
                                <CommandItem
                                    key={action}
                                    value={`${label} ${action}`}
                                    onSelect={() => handleSelect(action)}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1">{label}</span>
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                        {key}
                                    </kbd>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>

                    <CommandGroup heading="Navegación Adicional">
                        <CommandItem
                            value="ir a configuración"
                            onSelect={() => { closeSearch(); navigate('/settings'); }}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span>Ir a Configuración</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </CommandDialog>
    );
}

