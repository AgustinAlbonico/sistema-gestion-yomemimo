/**
 * Página principal de Cuentas Corrientes
 * Muestra lista de clientes con deuda y estadísticas
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useCustomerAccounts,
    useAccountsStats,
} from '../hooks/use-customer-accounts';
import { AccountStatus } from '../types';
import type { AccountFiltersDto } from '../types';

export function CustomerAccountsPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<AccountFiltersDto>({
        hasDebt: true,
        page: 1,
        limit: 20,
    });

    const { data: accountsData, isLoading } = useCustomerAccounts(filters);
    const { data: stats } = useAccountsStats();

    const handleFilterChange = (key: keyof AccountFiltersDto, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Cuentas Corrientes</h1>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Deudores
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalDebtors || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            de {stats?.totalAccounts || 0} cuentas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${Number(stats?.totalDebt || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Promedio: ${Number(stats?.averageDebt || 0).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Mora</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats?.overdueAccounts || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">clientes morosos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Deuda en Mora
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">
                            ${Number(stats?.totalOverdue || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.totalOverdue && stats?.totalDebt
                                ? `${((Number(stats.totalOverdue) / Number(stats.totalDebt)) * 100).toFixed(1)}% del total`
                                : '0% del total'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar cliente</label>
                            <Input
                                placeholder="Nombre del cliente..."
                                value={filters.search || ''}
                                onChange={(e) =>
                                    handleFilterChange('search', e.target.value || undefined)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estado</label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'status',
                                        value === 'all' ? undefined : (value as AccountStatus)
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value={AccountStatus.ACTIVE}>
                                        Activos
                                    </SelectItem>
                                    <SelectItem value={AccountStatus.SUSPENDED}>
                                        Suspendidos
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Con deuda</label>
                            <Select
                                value={filters.hasDebt === undefined ? 'all' : filters.hasDebt.toString()}
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'hasDebt',
                                        value === 'all' ? undefined : value === 'true'
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="true">Sí</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">En mora</label>
                            <Select
                                value={
                                    filters.isOverdue === undefined
                                        ? 'all'
                                        : filters.isOverdue.toString()
                                }
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'isOverdue',
                                        value === 'all' ? undefined : value === 'true'
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="true">Sí</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Cuentas */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Cuentas Corrientes
                        {accountsData && ` (${accountsData.total})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <p className="text-muted-foreground">Cargando...</p>
                        </div>
                    ) : accountsData && accountsData.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-3 text-left">Cliente</th>
                                            <th className="py-3 text-right">Saldo</th>
                                            <th className="py-3 text-right">Límite</th>
                                            <th className="py-3 text-center">Días Mora</th>
                                            <th className="py-3 text-center">Estado</th>
                                            <th className="py-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accountsData.data.map((account) => (
                                            <tr key={account.id} className="border-b">
                                                <td className="py-3">
                                                    {account.customer &&
                                                        `${account.customer.firstName} ${account.customer.lastName}`}
                                                </td>
                                                <td
                                                    className={`py-3 text-right font-semibold ${Number(account.balance) > 0 ? 'text-red-600' : Number(account.balance) < 0 ? 'text-green-600' : ''
                                                        }`}
                                                >
                                                    ${Number(account.balance).toFixed(2)}
                                                </td>
                                                <td className="py-3 text-right text-muted-foreground">
                                                    ${Number(account.creditLimit).toFixed(2)}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {account.daysOverdue > 0 && (
                                                        <Badge variant="destructive">
                                                            {account.daysOverdue} días
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Badge
                                                        variant={
                                                            account.status ===
                                                                AccountStatus.ACTIVE
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                    >
                                                        {account.status === AccountStatus.ACTIVE
                                                            ? 'Activa'
                                                            : 'Suspendida'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            navigate(
                                                                `/customer-accounts/${account.customerId}`
                                                            )
                                                        }
                                                    >
                                                        Ver Estado
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {accountsData.totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Página {accountsData.page} de{' '}
                                        {accountsData.totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleFilterChange('page', filters.page! - 1)
                                            }
                                            disabled={accountsData.page === 1}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleFilterChange('page', filters.page! + 1)
                                            }
                                            disabled={
                                                accountsData.page ===
                                                accountsData.totalPages
                                            }
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium">No se encontraron cuentas</p>
                            <p className="text-sm text-muted-foreground">
                                Intenta ajustar los filtros
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
