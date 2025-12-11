/**
 * Sidebar de navegación principal
 * Incluye logo, menú de navegación y perfil de usuario
 */
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
    LayoutDashboard,
    UserCircle,
    Settings,
    LogOut,
    Package,
    ShoppingCart,
    Receipt,
    Truck,
    Wallet,
    Building2,
    CreditCard,
    BarChart3,
    TrendingUp,
} from 'lucide-react';
import { Button } from './ui/button';
import { useLowStockCount } from '@/features/products/hooks/useLowStock';

interface SidebarProps {
    user: any;
    onLogout: () => void;
}

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badgeKey?: 'lowStock'; // Claves para badges dinámicos
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Productos',
        href: '/products',
        icon: Package,
        badgeKey: 'lowStock',
    },
    {
        title: 'Clientes',
        href: '/customers',
        icon: UserCircle,
    },
    {
        title: 'Proveedores',
        href: '/suppliers',
        icon: Building2,
    },
    {
        title: 'Compras',
        href: '/purchases',
        icon: Truck,
    },
    {
        title: 'Gastos',
        href: '/expenses',
        icon: Receipt,
    },
    {
        title: 'Ingresos',
        href: '/incomes',
        icon: TrendingUp,
    },
    {
        title: 'Ventas',
        href: '/sales',
        icon: ShoppingCart,
    },
    {
        title: 'Caja',
        href: '/cash-register',
        icon: Wallet,
    },
    {
        title: 'Cuentas Corrientes',
        href: '/customer-accounts',
        icon: CreditCard,
    },
    {
        title: 'Reportes',
        href: '/reports',
        icon: BarChart3,
    },
    {
        title: 'Configuración',
        href: '/settings',
        icon: Settings,
    },
];

export function Sidebar({ user, onLogout }: SidebarProps) {
    const location = useLocation();
    const { count: lowStockCount } = useLowStockCount();

    // Mapa de badges dinámicos
    const badges: Record<string, number> = {
        lowStock: lowStockCount,
    };

    return (
        <div className="flex flex-col h-full bg-card border-r border-border w-64 transition-all duration-300">
            {/* Header / Logo */}
            <div className="p-6 border-b border-border">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md shadow-primary/25">
                        SG
                    </div>
                    <span className="font-semibold text-lg text-foreground">
                        Sistema
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5 transition-colors flex-shrink-0',
                                        isActive
                                            ? 'text-primary-foreground'
                                            : 'text-muted-foreground group-hover:text-accent-foreground'
                                    )}
                                />
                                <span className="flex-1">{item.title}</span>
                                {badgeCount > 0 && (
                                    <span
                                        className={cn(
                                            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                                            isActive
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : 'bg-destructive text-destructive-foreground'
                                        )}
                                    >
                                        {badgeCount > 99 ? '99+' : badgeCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-border bg-muted/30">
                <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.username}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={onLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}
