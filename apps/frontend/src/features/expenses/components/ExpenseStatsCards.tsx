/**
 * Tarjetas de estadísticas de gastos
 */
import { useQuery } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses.api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Clock, Receipt, PieChart } from 'lucide-react';

interface ExpenseStatsCardsProps {
    readonly startDate?: string;
    readonly endDate?: string;
}

/**
 * Componente que muestra las estadísticas de gastos en tarjetas
 */
export function ExpenseStatsCards({ startDate, endDate }: ExpenseStatsCardsProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['expense-stats', startDate, endDate],
        queryFn: () => expensesApi.getStats(startDate, endDate),
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Gastos Pagados */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(stats?.totalAmount || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats?.totalExpenses || 0} gastos registrados
                    </p>
                </CardContent>
            </Card>

            {/* Gastos Pendientes */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(stats?.totalPending || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Por pagar
                    </p>
                </CardContent>
            </Card>

            {/* Cantidad de registros */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Registros</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.totalExpenses || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Gastos totales
                    </p>
                </CardContent>
            </Card>

            {/* Top Categoría */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mayor Categoría</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {stats?.byCategory && stats.byCategory.length > 0 ? (
                        <>
                            <div className="text-lg font-bold truncate">
                                {stats.byCategory[0].categoryName}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(stats.byCategory[0].total)}
                                {' • '}
                                {stats.byCategory[0].count} gastos
                            </p>
                        </>
                    ) : (
                        <div className="text-muted-foreground text-sm">
                            Sin datos
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Componente que muestra el desglose por categoría
 */
export function ExpenseCategoryBreakdown({ startDate, endDate }: ExpenseStatsCardsProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['expense-stats', startDate, endDate],
        queryFn: () => expensesApi.getStats(startDate, endDate),
    });

    if (isLoading || !stats?.byCategory?.length) {
        return null;
    }

    const total = stats.totalAmount || 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {stats.byCategory.slice(0, 5).map((cat) => {
                        const percentage = ((cat.total / total) * 100).toFixed(1);
                        return (
                            <div key={cat.categoryId} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>{cat.categoryName}</span>
                                    <span className="font-medium">
                                        {formatCurrency(cat.total)}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-red-500 h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {percentage}% • {cat.count} gastos
                                </p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

