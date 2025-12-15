/**
 * Lista de gastos con tabla y acciones
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { expensesApi } from '../api/expenses.api';
import { Expense, ExpenseFilters } from '../types';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
    ArrowUpDown,
    Edit,
    Trash,
    MoreHorizontal,
    Eye,
    CheckCircle2,
    Clock,
    CreditCard,
    Receipt,
    Tag,
    Calendar,
    Wallet,
    FileText,
    User,
    DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate as formatDateUtil } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MarkAsPaidDialog } from './MarkAsPaidDialog';

interface ExpenseListProps {
    readonly filters?: ExpenseFilters;
    readonly onEdit: (expense: Expense) => void;
    readonly onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un gasto con diseño mejorado
 */
function ExpenseDetailDialog({
    expense,
    open,
    onClose,
}: {
    expense: Expense | null;
    open: boolean;
    onClose: () => void;
}) {
    if (!expense) return null;

    const formatDateDisplay = (dateStr: string) => {
        return formatDateUtil(dateStr);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 py-5 text-primary-foreground">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold tracking-tight">
                                Detalle del Gasto
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge
                                    variant="secondary"
                                    className={expense.isPaid
                                        ? "bg-green-500/30 text-white border-green-400/50"
                                        : "bg-yellow-500/30 text-white border-yellow-400/50"
                                    }
                                >
                                    {expense.isPaid ? (
                                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Pagado</>
                                    ) : (
                                        <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
                                    )}
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
                            <p className="font-medium">{expense.description}</p>
                        </div>
                    </div>

                    {/* Categoría */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Categoría</span>
                        </div>
                        {expense.category ? (
                            <Badge
                                variant="outline"
                                className="px-3 py-1"
                            >
                                {expense.category.name}
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground text-sm">Sin categoría</span>
                        )}
                    </div>

                    <Separator />

                    {/* Monto destacado */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Monto
                            </span>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 p-4 border border-red-200 dark:border-red-800/50 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                    Total del Gasto
                                </span>
                                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(expense.amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Información de pago */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Información de Pago
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Fecha del gasto */}
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Fecha del gasto</p>
                                </div>
                                <p className="text-sm font-semibold">
                                    {formatDateDisplay(expense.expenseDate)}
                                </p>
                            </div>

                            {/* Método de pago */}
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800/50">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <CreditCard className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    <p className="text-xs text-blue-600 dark:text-blue-400">Método de pago</p>
                                </div>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                    {expense.paymentMethod?.name || 'No especificado'}
                                </p>
                            </div>
                        </div>

                        {/* Nro. Comprobante */}
                        {expense.receiptNumber ? (
                            <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Nro. Comprobante</span>
                                    </div>
                                    <span className="font-mono text-sm font-medium">{expense.receiptNumber}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Notas */}
                    {expense.notes ? (
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
                                        {expense.notes}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : null}

                    {/* Registrado por */}
                    {expense.createdBy ? (
                        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>
                                Registrado por: {expense.createdBy.firstName} {expense.createdBy.lastName}
                            </span>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Componente de lista de gastos con tabla
 */
export function ExpenseList({ filters, onEdit, onDelete }: ExpenseListProps) {
    const [viewExpense, setViewExpense] = useState<Expense | null>(null);
    const [expenseToMarkPaid, setExpenseToMarkPaid] = useState<Expense | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['expenses', filters],
        queryFn: () => expensesApi.getAll(filters),
    });

    const markAsPaidMutation = useMutation({
        mutationFn: ({ id, paymentMethodId }: { id: string; paymentMethodId: string }) =>
            expensesApi.markAsPaid(id, paymentMethodId),
        onSuccess: () => {
            toast.success('Gasto marcado como pagado');
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
            setExpenseToMarkPaid(null);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al marcar como pagado';
            toast.error(message);
        },
    });

    const handleMarkAsPaid = (expenseId: string, paymentMethodId: string) => {
        markAsPaidMutation.mutate({ id: expenseId, paymentMethodId });
    };

    const formatExpenseDate = (dateStr: string) => {
        return formatDateUtil(dateStr);
    };

    const columns: ColumnDef<Expense>[] = [
        {
            accessorKey: 'expenseDate',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Fecha
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {formatExpenseDate(row.original.expenseDate)}
                </span>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Descripción',
            cell: ({ row }) => {
                const expense = row.original;
                return (
                    <div className="max-w-[250px]">
                        <p className="font-medium truncate">{expense.description}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'category',
            header: 'Categoría',
            cell: ({ row }) => {
                const category = row.original.category;
                return category ? (
                    <Badge variant="outline">{category.name}</Badge>
                ) : (
                    <span className="text-muted-foreground text-sm">Sin categoría</span>
                );
            },
        },
        {
            accessorKey: 'amount',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Monto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: 'isPaid',
            header: 'Estado',
            cell: ({ row }) => {
                const isPaid = row.original.isPaid;
                return (
                    <div className="flex items-center gap-1">
                        {isPaid ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 text-sm">Pagado</span>
                            </>
                        ) : (
                            <>
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span className="text-yellow-600 text-sm">Pendiente</span>
                            </>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const expense = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setViewExpense(expense)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </DropdownMenuItem>
                            {expense.isPaid ? null : (
                                <DropdownMenuItem
                                    onClick={() => setExpenseToMarkPaid(expense)}
                                    className="text-green-600"
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Marcar como Pagado
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onEdit(expense)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(expense.id)}
                                className="text-destructive"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                Cargando gastos...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-destructive p-4">Error al cargar los gastos</div>
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={data?.data || []}
                searchKey="description"
                searchPlaceholder="Buscar gasto..."
            />
            <ExpenseDetailDialog
                expense={viewExpense}
                open={!!viewExpense}
                onClose={() => setViewExpense(null)}
            />
            <MarkAsPaidDialog
                expense={expenseToMarkPaid}
                open={!!expenseToMarkPaid}
                onClose={() => setExpenseToMarkPaid(null)}
                onConfirm={handleMarkAsPaid}
                isLoading={markAsPaidMutation.isPending}
            />
        </>
    );
}

