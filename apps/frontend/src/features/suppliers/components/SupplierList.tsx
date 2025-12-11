/**
 * Lista de proveedores con tabla, filtros y acciones
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { suppliersApi } from '../api/suppliers.api';
import { Supplier, IvaConditionLabels } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowUpDown,
    Edit,
    Trash,
    MoreHorizontal,
    Eye,
    Phone,
    Mail,
    MapPin,
    Globe,
    Building2,
    CreditCard,
} from 'lucide-react';
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

interface SupplierListProps {
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un proveedor
 */
function SupplierDetailDialog({
    supplier,
    open,
    onClose,
}: {
    supplier: Supplier | null;
    open: boolean;
    onClose: () => void;
}) {
    if (!supplier) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{supplier.name}</DialogTitle>
                    {supplier.tradeName && (
                        <p className="text-muted-foreground">{supplier.tradeName}</p>
                    )}
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Estado */}
                    <div className="flex justify-between items-center">
                        <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                            {supplier.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {supplier.ivaCondition && (
                            <Badge variant="outline">
                                {IvaConditionLabels[supplier.ivaCondition]}
                            </Badge>
                        )}
                    </div>

                    {/* Documento */}
                    {supplier.documentNumber && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Documento</span>
                            <span className="font-medium">
                                {supplier.documentType}: {supplier.documentNumber}
                            </span>
                        </div>
                    )}

                    {/* Contacto */}
                    {supplier.contactName && (
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>Contacto: {supplier.contactName}</span>
                        </div>
                    )}

                    {supplier.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                                href={`mailto:${supplier.email}`}
                                className="text-primary hover:underline"
                            >
                                {supplier.email}
                            </a>
                        </div>
                    )}

                    {(supplier.phone || supplier.mobile) && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>
                                {supplier.phone}
                                {supplier.phone && supplier.mobile && ' / '}
                                {supplier.mobile}
                            </span>
                        </div>
                    )}

                    {supplier.website && (
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                                href={supplier.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {supplier.website}
                            </a>
                        </div>
                    )}

                    {/* Dirección */}
                    {(supplier.address || supplier.city) && (
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                {supplier.address && <p>{supplier.address}</p>}
                                <p className="text-muted-foreground">
                                    {[supplier.city, supplier.state, supplier.postalCode]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cuenta bancaria */}
                    {supplier.bankAccount && (
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{supplier.bankAccount}</span>
                        </div>
                    )}

                    {/* Notas */}
                    {supplier.notes && (
                        <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm font-medium mb-1">Notas</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {supplier.notes}
                            </p>
                        </div>
                    )}

                    {/* Fechas */}
                    <div className="text-xs text-muted-foreground border-t pt-3">
                        <p>
                            Creado:{' '}
                            {new Date(supplier.createdAt).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Componente principal de lista de proveedores
 */
export function SupplierList({ onEdit, onDelete }: SupplierListProps) {
    const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);

    // Query para proveedores
    const { data, isLoading, error } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () =>
            suppliersApi.getAll({
                limit: 100,
                sortBy: 'name',
                order: 'ASC',
            }),
    });

    const columns: ColumnDef<Supplier>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Proveedor
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <div>
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.documentNumber && (
                            <p className="text-xs text-muted-foreground">
                                {supplier.documentType}: {supplier.documentNumber}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'email',
            header: 'Contacto',
            cell: ({ row }) => {
                const supplier = row.original;
                return (
                    <div className="text-sm">
                        {supplier.email && (
                            <p className="truncate max-w-[180px]">{supplier.email}</p>
                        )}
                        {supplier.mobile && (
                            <p className="text-muted-foreground">{supplier.mobile}</p>
                        )}
                        {!supplier.email && !supplier.mobile && (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'city',
            header: 'Ubicación',
            cell: ({ row }) => {
                const supplier = row.original;
                if (!supplier.city && !supplier.state) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <span className="text-sm">
                        {[supplier.city, supplier.state].filter(Boolean).join(', ')}
                    </span>
                );
            },
        },
        {
            accessorKey: 'isActive',
            header: 'Estado',
            cell: ({ row }) => {
                const isActive = row.original.isActive;
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const supplier = row.original;

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
                            <DropdownMenuItem onClick={() => setViewSupplier(supplier)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(supplier)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(supplier.id)}
                                className="text-destructive"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Desactivar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">Cargando...</div>
        );
    }

    if (error) {
        return (
            <div className="text-destructive p-4">Error al cargar proveedores</div>
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={data?.data || []}
                searchKey="name"
                searchPlaceholder="Buscar proveedor..."
            />
            <SupplierDetailDialog
                supplier={viewSupplier}
                open={!!viewSupplier}
                onClose={() => setViewSupplier(null)}
            />
        </>
    );
}
