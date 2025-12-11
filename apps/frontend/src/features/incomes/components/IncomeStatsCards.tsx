/**
 * Tarjetas de estadísticas de ingresos
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, Clock } from 'lucide-react';
import { incomesApi } from '../api/incomes.api';

interface IncomeStatsCardsProps {
    startDate?: string;
    endDate?: string;
}

export function IncomeStatsCards({ startDate, endDate }: IncomeStatsCardsProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['income-stats', startDate, endDate],
        queryFn: () => incomesApi.getStats(startDate, endDate),
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalIncomes ?? 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Registros en el período
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        ${(stats?.totalAmount ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Ingresos cobrados
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                        ${(stats?.totalPending ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Por cobrar
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Desglose de ingresos por categoría
 */
export function IncomeCategoryBreakdown({ startDate, endDate }: IncomeStatsCardsProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['income-stats', startDate, endDate],
        queryFn: () => incomesApi.getStats(startDate, endDate),
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    const byCategory = stats?.byCategory ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
                {byCategory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Sin datos para mostrar
                    </p>
                ) : (
                    <div className="space-y-3">
                        {byCategory.map((cat) => (
                            <div key={cat.categoryId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <span className="text-sm">{cat.categoryName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({cat.count})
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-green-600">
                                    ${cat.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
