/**
 * Tarjeta de métrica para dashboard de reportes
 */
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
    readonly title: string;
    readonly value: number;
    readonly subtitle?: string;
    readonly icon: LucideIcon;
    readonly trend?: number;
    readonly format?: 'currency' | 'number' | 'percent';
    readonly variant?: 'default' | 'success' | 'warning' | 'danger';
    readonly isLoading?: boolean;
}

export function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    format = 'currency',
    variant = 'default',
    isLoading = false,
}: MetricCardProps) {
    const formatValue = (val: number) => {
        switch (format) {
            case 'currency':
                return formatCurrency(val);
            case 'percent':
                return `${val.toFixed(1)}%`;
            case 'number':
            default:
                return val.toLocaleString('es-AR');
        }
    };

    const variantStyles = {
        default: 'bg-primary/10 text-primary',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    };

    const valueStyles = {
        default: 'text-foreground',
        success: 'text-emerald-600 dark:text-emerald-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        danger: 'text-red-600 dark:text-red-400',
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className={cn('text-2xl font-bold', valueStyles[variant])}>
                            {formatValue(value)}
                        </p>
                        {(subtitle || trend !== undefined) && (
                            <div className="flex items-center gap-2">
                                {trend !== undefined && (
                                    <span
                                        className={cn(
                                            'text-xs font-medium',
                                            trend > 0
                                                ? 'text-emerald-600'
                                                : trend < 0
                                                ? 'text-red-600'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}{' '}
                                        {Math.abs(trend).toFixed(1)}%
                                    </span>
                                )}
                                {subtitle && (
                                    <span className="text-xs text-muted-foreground">{subtitle}</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', variantStyles[variant])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
