/**
 * Sidebar de navegación principal
 * Incluye logo, menú de navegación y perfil de usuario
 * Soporta modo colapsado para maximizar espacio de trabajo
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
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { useLowStockCount } from '@/features/products/hooks/useLowStock';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './ui/tooltip';

interface SidebarProps {
    readonly user: any;
    readonly onLogout: () => void;
    readonly collapsed?: boolean;
    readonly onToggle?: () => void;
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

export function Sidebar({ user, onLogout, collapsed = false, onToggle }: SidebarProps) {
    const location = useLocation();
    const { count: lowStockCount } = useLowStockCount();

    // Mapa de badges dinámicos
    const badges: Record<string, number> = {
        lowStock: lowStockCount,
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    "flex flex-col h-full bg-card border-r border-border transition-all duration-300 relative",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                {/* Botón de toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="absolute -right-3 top-7 z-50 h-6 w-6 rounded-full border border-border bg-card shadow-sm hover:bg-accent"
                >
                    {collapsed ? (
                        <ChevronRight className="h-3 w-3" />
                    ) : (
                        <ChevronLeft className="h-3 w-3" />
                    )}
                </Button>

                {/* Header / Logo */}
                <div className={cn("p-6 border-b border-border", collapsed && "px-3 py-4")}>
                    <Link to="/dashboard" className="flex items-center justify-center gap-3 ">
                        {collapsed ? (
                            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md shadow-primary/25 flex-shrink-0">
                                NP
                            </div>
                        ) : (
                            <img
                                src="/src/assets/logo-nexopos.png"
                                alt="NexoPOS"
                                className="h-10 w-auto"
                            />
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

                            const linkContent = (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                        collapsed && 'justify-center px-2'
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
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1">{item.title}</span>
                                            {badgeCount > 0 ? (
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
                                            ) : null}
                                        </>
                                    )}
                                    {collapsed && badgeCount > 0 && (
                                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
                                    )}
                                </Link>
                            );

                            // En modo colapsado, envolver con tooltip
                            if (collapsed) {
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>
                                            <div className="relative">
                                                {linkContent}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="flex items-center gap-2">
                                            {item.title}
                                            {badgeCount > 0 && (
                                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                                                    {badgeCount > 99 ? '99+' : badgeCount}
                                                </span>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return linkContent;
                        })}
                    </div>
                </nav>

                {/* User Profile & Logout */}
                <div className={cn("p-4 border-t border-border bg-muted/30", collapsed && "px-2")}>
                    {!collapsed ? (
                        <>
                            <div className="flex items-center gap-3 mb-3 px-1">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
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
                        </>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={onLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                Cerrar Sesión
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
