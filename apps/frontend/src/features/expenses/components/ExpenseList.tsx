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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate, formatDateForDisplay } from '@/lib/date-utils';
import { toast } from 'sonner';
import { MarkAsPaidDialog } from './MarkAsPaidDialog';

interface ExpenseListProps {
    filters?: ExpenseFilters;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un gasto
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

    const formatDate = (dateStr: string) => {
        // Usar utilidad centralizada para formato largo
        return formatDateForDisplay(dateStr, 'long');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Detalle del Gasto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Descripción */}
                    <div>
                        <span className="text-sm text-muted-foreground">Descripción</span>
                        <p className="font-medium">{expense.description}</p>
                    </div>

                    {/* Categoría */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Categoría</span>
                        {expense.category ? (
                            <Badge variant="outline">{expense.category.name}</Badge>
                        ) : (
                            <span className="text-muted-foreground text-sm">Sin categoría</span>
                        )}
                    </div>

                    {/* Monto */}
                    <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-800">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-red-800 dark:text-red-200">
                                Monto
                            </span>
                            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(expense.amount)}
                            </span>
                        </div>
                    </div>

                    {/* Fecha */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fecha del gasto</span>
                        <span className="font-medium">
                            {formatDate(expense.expenseDate)}
                        </span>
                    </div>

                    {/* Método de pago */}
                    {expense.paymentMethod && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Método de pago</span>
                            <span className="font-medium">
                                {expense.paymentMethod.name}
                            </span>
                        </div>
                    )}

                    {/* Nro. Comprobante */}
                    {expense.receiptNumber && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Nro. Comprobante</span>
                            <span className="font-medium">{expense.receiptNumber}</span>
                        </div>
                    )}

                    {/* Estado */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estado</span>
                        <Badge
                            variant={expense.isPaid ? 'default' : 'secondary'}
                            className={
                                expense.isPaid
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }
                        >
                            {expense.isPaid ? 'Pagado' : 'Pendiente'}
                        </Badge>
                    </div>

                    {/* Notas */}
                    {expense.notes && (
                        <div>
                            <span className="text-sm text-muted-foreground">Notas</span>
                            <p className="text-sm mt-1 p-2 bg-muted rounded">
                                {expense.notes}
                            </p>
                        </div>
                    )}

                    {/* Creado por */}
                    {expense.createdBy && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Registrado por</span>
                            <span>
                                {expense.createdBy.firstName} {expense.createdBy.lastName}
                            </span>
                        </div>
                    )}
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

    const formatDate = (dateStr: string) => {
        // Usar utilidad centralizada que maneja zona horaria correctamente
        return formatDateForDisplay(dateStr, 'short');
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
                    {formatDate(row.original.expenseDate)}
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
                            {!expense.isPaid && (
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

