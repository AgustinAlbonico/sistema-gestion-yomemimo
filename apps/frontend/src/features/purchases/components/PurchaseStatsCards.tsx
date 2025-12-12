/**
 * Componente de tarjetas de estadísticas de compras
 */
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, DollarSign, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { purchasesApi } from '../api/purchases.api';

interface PurchaseStatsCardsProps {
    readonly startDate?: string;
    readonly endDate?: string;
}

/**
 * Formatea un número como moneda ARS
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(value);
}

export function PurchaseStatsCards({ startDate, endDate }: PurchaseStatsCardsProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['purchase-stats', startDate, endDate],
        queryFn: () => purchasesApi.getStats(startDate, endDate),
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Compras',
            value: stats?.totalPurchases ?? 0,
            icon: ShoppingCart,
            format: (v: number) => v.toString(),
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Monto Total',
            value: stats?.totalAmount ?? 0,
            icon: DollarSign,
            format: formatCurrency,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            title: 'Pagado',
            value: stats?.totalPaid ?? 0,
            icon: DollarSign,
            format: formatCurrency,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        },
        {
            title: 'Pendiente',
            value: stats?.totalPending ?? 0,
            icon: Clock,
            format: formatCurrency,
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {card.format(card.value)}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

