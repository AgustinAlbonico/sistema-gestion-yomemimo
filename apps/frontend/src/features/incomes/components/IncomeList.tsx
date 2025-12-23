/**
 * Lista de ingresos con tabla y acciones
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    CheckCircle,
    User,
    Building2,
    Wallet,
    Tag,
    Calendar,
    CreditCard,
    Receipt,
    FileText,
    DollarSign,
    Clock,
    CheckCircle2,
    Landmark,
} from 'lucide-react';
import { incomesApi } from '../api/incomes.api';
import { Income, IncomeFilters } from '../types';
import { formatDateForDisplay } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { MarkAsPaidDialog } from './MarkAsPaidDialog';

interface IncomeListProps {
    readonly filters?: IncomeFilters;
    readonly onEdit: (income: Income) => void;
    readonly onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un ingreso con diseño mejorado
 */
function IncomeDetailDialog({
    income,
    open,
    onClose,
}: Readonly<{
    income: Income | null;
    open: boolean;
    onClose: () => void;
}>) {
    if (!income) return null;

    const getCustomerName = () => {
        if (income.customer) {
            return income.customer.businessName || `${income.customer.firstName} ${income.customer.lastName}`;
        }
        return income.customerName || 'Consumidor Final';
    };

    const getStatusInfo = () => {
        if (income.isPaid) {
            return { label: 'Cobrado', icon: CheckCircle2, className: 'bg-green-500/30 text-white border-green-400/50' };
        }
        if (income.isOnAccount) {
            return { label: 'Cuenta Corriente', icon: Landmark, className: 'bg-blue-500/30 text-white border-blue-400/50' };
        }
        return { label: 'Pendiente', icon: Clock, className: 'bg-yellow-500/30 text-white border-yellow-400/50' };
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 py-5 text-primary-foreground">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold tracking-tight">
                                Detalle del Ingreso
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge
                                    variant="secondary"
                                    className={statusInfo.className}
                                >
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusInfo.label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="p-6 space-y-5">
                    {/* Descripción */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Descripción
                            </span>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                            <p className="font-medium">{income.description}</p>
                        </div>
                    </div>

                    {/* Monto destacado */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Monto
                            </span>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 p-4 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                    Total del Ingreso
                                </span>
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(income.amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Información de cliente y categoría */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Cliente */}
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 mb-1">
                                {income.customer?.businessName ? (
                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                    <User className="h-3 w-3 text-muted-foreground" />
                                )}
                                <p className="text-xs text-muted-foreground">Cliente</p>
                            </div>
                            <p className="text-sm font-semibold truncate" title={getCustomerName()}>
                                {getCustomerName()}
                            </p>
                        </div>

                        {/* Categoría */}
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800/50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Tag className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <p className="text-xs text-blue-600 dark:text-blue-400">Categoría</p>
                            </div>
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                {income.category?.name ?? 'Sin categoría'}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Información de pago */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Información de Pago
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Fecha */}
                            <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Fecha</p>
                                </div>
                                <p className="text-sm font-semibold">
                                    {formatDateForDisplay(income.incomeDate)}
                                </p>
                            </div>

                            {/* Método de pago */}
                            {income.paymentMethod ? (
                                <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Método de Pago</p>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {income.paymentMethod.name}
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        {/* Comprobante */}
                        {income.receiptNumber ? (
                            <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Comprobante</span>
                                    </div>
                                    <span className="font-mono text-sm font-medium">{income.receiptNumber}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Notas */}
                    {income.notes ? (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Notas
                                    </span>
                                </div>
                                <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {income.notes}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : null}

                    {/* Registrado por */}
                    {income.createdBy ? (
                        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>
                                Registrado por: {income.createdBy.firstName} {income.createdBy.lastName}
                            </span>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Componente de lista de ingresos con tabla
 */
export function IncomeList({ filters, onEdit, onDelete }: IncomeListProps) {
    const queryClient = useQueryClient();
    const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
    const [pendingMarkAsPaid, setPendingMarkAsPaid] = useState<Income | null>(null);

    // Query para ingresos
    const { data, isLoading } = useQuery({
        queryKey: ['incomes', filters],
        queryFn: () => incomesApi.getAll(filters),
    });

    // Mutación para marcar como pagado
    const markAsPaidMutation = useMutation({
        mutationFn: ({ id, paymentMethodId }: { id: string; paymentMethodId: string }) =>
            incomesApi.markAsPaid(id, paymentMethodId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            queryClient.invalidateQueries({ queryKey: ['income-stats'] });
            queryClient.invalidateQueries({ queryKey: ['cash-register', 'current'] });
            toast.success('Ingreso marcado como cobrado');
            setPendingMarkAsPaid(null);
        },
        onError: (error: Error) => {
            toast.error(`Error: ${error.message}`);
        },
    });

    const handleMarkAsPaid = (incomeId: string, paymentMethodId: string) => {
        markAsPaidMutation.mutate({ id: incomeId, paymentMethodId });
    };

    // Columnas de la tabla
    const columns: ColumnDef<Income>[] = [
        {
            accessorKey: 'incomeDate',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Fecha
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-sm">{formatDateForDisplay(row.original.incomeDate)}</span>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Descripción',
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate" title={row.original.description}>
                    {row.original.description}
                </div>
            ),
        },
        {
            accessorKey: 'customer',
            header: 'Cliente',
            cell: ({ row }) => {
                const income = row.original;
                const customerName = income.customer
                    ? (income.customer.businessName || `${income.customer.firstName} ${income.customer.lastName}`)
                    : income.customerName || 'Consumidor Final';
                const Icon = income.customer?.businessName ? Building2 : User;
                return (
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]" title={customerName}>
                            {customerName}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'category',
            header: 'Categoría',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.category?.name ?? 'Sin categoría'}
                </Badge>
            ),
        },
        {
            accessorKey: 'amount',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Monto
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-medium text-green-600">
                    ${row.original.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            accessorKey: 'isPaid',
            header: 'Estado',
            cell: ({ row }) => {
                const income = row.original;
                if (income.isPaid) {
                    return <Badge variant="default">Cobrado</Badge>;
                }
                if (income.isOnAccount) {
                    return <Badge variant="secondary">Cuenta Corriente</Badge>;
                }
                return <Badge variant="outline">Pendiente</Badge>;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const income = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedIncome(income)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(income)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            {!income.isPaid && !income.isOnAccount && (
                                <DropdownMenuItem onClick={() => setPendingMarkAsPaid(income)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marcar Cobrado
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(income.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={data?.data ?? []}
                isLoading={isLoading}
            />

            {/* Modal de detalle */}
            <IncomeDetailDialog
                income={selectedIncome}
                open={!!selectedIncome}
                onClose={() => setSelectedIncome(null)}
            />

            {/* Modal para marcar como pagado */}
            <MarkAsPaidDialog
                open={!!pendingMarkAsPaid}
                onClose={() => setPendingMarkAsPaid(null)}
                onConfirm={(paymentMethodId) => {
                    if (pendingMarkAsPaid) {
                        handleMarkAsPaid(pendingMarkAsPaid.id, paymentMethodId);
                    }
                }}
                isLoading={markAsPaidMutation.isPending}
            />
        </>
    );
}
