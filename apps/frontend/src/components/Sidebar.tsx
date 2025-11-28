import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ChevronRight,
    Package,
    ShoppingCart,
} from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
    user: any;
    onLogout: () => void;
}

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
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
    },
    {
        title: 'Ventas',
        href: '/sales',
        icon: ShoppingCart,
    },
    {
        title: 'Usuarios',
        href: '/users',
        icon: Users,
    },
    {
        title: 'Configuración',
        href: '/settings',
        icon: Settings,
    },
];

export function Sidebar({ user, onLogout }: SidebarProps) {
    const location = useLocation();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 transition-all duration-300">
            {/* Header / Logo */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        SG
                    </div>
                    <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                        Sistema
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-5 w-5 transition-colors',
                                    isActive
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                                )}
                            />
                            {item.title}
                            {isActive && (
                                <ChevronRight className="ml-auto h-4 w-4 text-indigo-600 dark:text-indigo-400 opacity-50" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.username}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-slate-200 dark:border-slate-800"
                    onClick={onLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}
