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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2, CheckCircle, User, Building2 } from 'lucide-react';
import { incomesApi } from '../api/incomes.api';
import { Income, IncomeFilters } from '../types';
import { formatDateForDisplay } from '@/lib/date-utils';
import { toast } from 'sonner';
import { MarkAsPaidDialog } from './MarkAsPaidDialog';

interface IncomeListProps {
    readonly filters?: IncomeFilters;
    readonly onEdit: (income: Income) => void;
    readonly onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un ingreso
 */
function IncomeDetailDialog({
    income,
    open,
    onClose,
}: {
    income: Income | null;
    open: boolean;
    onClose: () => void;
}) {
    if (!income) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Detalle del Ingreso</DialogTitle>
                    <DialogDescription>
                        Información completa del ingreso
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Descripción</p>
                            <p className="font-medium">{income.description}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Monto</p>
                            <p className="font-medium text-green-600">
                                ${income.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Fecha</p>
                            <p className="font-medium">{formatDateForDisplay(income.incomeDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Categoría</p>
                            <p className="font-medium">{income.category?.name ?? 'Sin categoría'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Cliente</p>
                            <p className="font-medium">
                                {income.customer
                                    ? (income.customer.businessName || `${income.customer.firstName} ${income.customer.lastName}`)
                                    : income.customerName || 'Consumidor Final'
                                }
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Estado</p>
                            <Badge variant={income.isPaid ? 'default' : 'secondary'}>
                                {income.isPaid ? 'Cobrado' : (income.isOnAccount ? 'Cuenta Corriente' : 'Pendiente')}
                            </Badge>
                        </div>
                        {income.paymentMethod && (
                            <div>
                                <p className="text-sm text-muted-foreground">Método de Pago</p>
                                <p className="font-medium">{income.paymentMethod.name}</p>
                            </div>
                        )}
                        {income.receiptNumber && (
                            <div>
                                <p className="text-sm text-muted-foreground">Comprobante</p>
                                <p className="font-medium">{income.receiptNumber}</p>
                            </div>
                        )}
                    </div>
                    {income.notes && (
                        <div>
                            <p className="text-sm text-muted-foreground">Notas</p>
                            <p className="text-sm">{income.notes}</p>
                        </div>
                    )}
                    {income.createdBy && (
                        <div className="pt-2 border-t text-sm text-muted-foreground">
                            Registrado por: {income.createdBy.firstName} {income.createdBy.lastName}
                        </div>
                    )}
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
