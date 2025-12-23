/**
 * Componente de lista de compras
 */
import { useQuery } from '@tanstack/react-query';
import { Eye, Edit, Trash2, MoreVertical, CheckCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { purchasesApi } from '../api/purchases.api';
import {
    Purchase,
    PurchaseFilters,
    PurchaseStatus,
    PurchaseStatusLabels,
    PurchaseStatusColors,
} from '../types';
import { formatDateForDisplay } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';

interface PurchaseListProps {
    readonly filters: PurchaseFilters;
    readonly onView?: (purchase: Purchase) => void;
    readonly onEdit?: (purchase: Purchase) => void;
    readonly onDelete?: (id: string) => void;
    readonly onPay?: (purchase: Purchase) => void;
}

export function PurchaseList({
    filters,
    onView,
    onEdit,
    onDelete,
    onPay,
}: PurchaseListProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['purchases', filters],
        queryFn: () => purchasesApi.getAll(filters),
    });

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={`skeleton-${i}`} className="h-16 bg-muted animate-pulse rounded" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-destructive">
                Error al cargar las compras
            </div>
        );
    }

    if (!data?.data || data.data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <ShoppingCartIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay compras registradas</p>
                <p className="text-sm">Las compras que registres aparecerán aquí</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.data.map((purchase) => (
                        <TableRow key={purchase.id}>
                            <TableCell className="font-mono text-sm">
                                {purchase.purchaseNumber}
                            </TableCell>
                            <TableCell>
                                {formatDateForDisplay(purchase.purchaseDate, 'short')}
                            </TableCell>
                            <TableCell>
                                <div>
                                    <p className="font-medium">{purchase.providerName}</p>
                                    {purchase.invoiceNumber ? (
                                        <p className="text-xs text-muted-foreground">
                                            Factura: {purchase.invoiceNumber}
                                        </p>
                                    ) : null}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-muted-foreground">
                                    {purchase.items.length} producto{purchase.items.length !== 1 ? 's' : ''}
                                </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(purchase.total)}
                            </TableCell>
                            <TableCell>
                                <Badge className={PurchaseStatusColors[purchase.status]}>
                                    {PurchaseStatusLabels[purchase.status]}
                                </Badge>
                                {purchase.inventoryUpdated ? (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                        Stock ✓
                                    </Badge>
                                ) : null}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {onView ? (
                                            <DropdownMenuItem onClick={() => onView(purchase)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ver Detalle
                                            </DropdownMenuItem>
                                        ) : null}
                                        {onEdit && purchase.status === PurchaseStatus.PENDING ? (
                                            <DropdownMenuItem onClick={() => onEdit(purchase)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                        ) : null}
                                        <DropdownMenuSeparator />
                                        {onPay && purchase.status === PurchaseStatus.PENDING ? (
                                            <DropdownMenuItem onClick={() => onPay(purchase)}>
                                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                Marcar Pagada
                                            </DropdownMenuItem>
                                        ) : null}
                                        {/* Only allow delete on pending purchases */}
                                        <DropdownMenuSeparator />
                                        {onDelete && purchase.status === PurchaseStatus.PENDING ? (
                                            <DropdownMenuItem
                                                onClick={() => onDelete(purchase.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        ) : null}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Paginación */}
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Mostrando {data.data.length} de {data.total} compras
                    </span>
                    <span>
                        Página {data.page} de {data.totalPages}
                    </span>
                </div>
            )}
        </div>
    );
}

// Icono placeholder
function ShoppingCartIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
        </svg>
    );
}

