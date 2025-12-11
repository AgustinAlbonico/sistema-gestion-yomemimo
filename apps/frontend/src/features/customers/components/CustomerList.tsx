/**
 * Lista de clientes con tabla, filtros y acciones
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { customersApi, customerCategoriesApi } from '../api/customers.api';
import { Customer } from '../types';
import { IvaConditionLabels } from '@/types/iva-condition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowUpDown,
    Edit,
    Trash,
    MoreHorizontal,
    Eye,
    Phone,
    Mail,
    MapPin,
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

interface CustomerListProps {
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un cliente
 */
function CustomerDetailDialog({
    customer,
    open,
    onClose,
}: {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
}) {
    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {customer.firstName} {customer.lastName}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Categoría y Estado */}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            {customer.category && (
                                <Badge
                                    variant="outline"
                                    style={{
                                        borderColor: customer.category.color || undefined,
                                        backgroundColor: customer.category.color
                                            ? `${customer.category.color}20`
                                            : undefined,
                                    }}
                                >
                                    {customer.category.name}
                                </Badge>
                            )}
                        </div>
                        <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                            {customer.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>

                    {/* Documento */}
                    {customer.documentNumber && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Documento</span>
                            <span className="font-medium">
                                {customer.documentType}: {customer.documentNumber}
                            </span>
                        </div>
                    )}

                    {/* Condición IVA */}
                    {customer.ivaCondition && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Condición IVA</span>
                            <span className="font-medium">
                                {IvaConditionLabels[customer.ivaCondition]}
                            </span>
                        </div>
                    )}

                    {/* Contacto */}
                    {customer.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                                href={`mailto:${customer.email}`}
                                className="text-primary hover:underline"
                            >
                                {customer.email}
                            </a>
                        </div>
                    )}

                    {(customer.phone || customer.mobile) && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>
                                {customer.phone}
                                {customer.phone && customer.mobile && ' / '}
                                {customer.mobile}
                            </span>
                        </div>
                    )}

                    {/* Dirección */}
                    {(customer.address || customer.city) && (
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                {customer.address && <p>{customer.address}</p>}
                                <p className="text-muted-foreground">
                                    {[customer.city, customer.state, customer.postalCode]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Notas */}
                    {customer.notes && (
                        <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm font-medium mb-1">Notas</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {customer.notes}
                            </p>
                        </div>
                    )}

                    {/* Fechas */}
                    <div className="text-xs text-muted-foreground border-t pt-3">
                        <p>
                            Creado:{' '}
                            {new Date(customer.createdAt).toLocaleDateString('es-AR', {
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
 * Componente principal de lista de clientes
 */
export function CustomerList({ onEdit, onDelete }: CustomerListProps) {
    const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    // Query para categorías
    const { data: categories } = useQuery({
        queryKey: ['customer-categories'],
        queryFn: () => customerCategoriesApi.getAll(),
    });

    // Query para clientes (carga todos para filtrado en cliente)
    const { data, isLoading, error } = useQuery({
        queryKey: ['customers', { categoryId: selectedCategoryId }],
        queryFn: () =>
            customersApi.getAll({
                limit: 100,
                categoryId: selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
                sortBy: 'lastName',
                order: 'ASC',
            }),
    });

    // Componente del filtro de categorías
    const categoryFilter = (
        <Select
            value={selectedCategoryId || 'all'}
            onValueChange={setSelectedCategoryId}
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                            {category.color && (
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                />
                            )}
                            {category.name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: 'lastName',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Cliente
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const customer = row.original;
                return (
                    <div>
                        <p className="font-medium">
                            {customer.lastName}, {customer.firstName}
                        </p>
                        {customer.documentNumber && (
                            <p className="text-xs text-muted-foreground">
                                {customer.documentType}: {customer.documentNumber}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'category',
            header: 'Categoría',
            cell: ({ row }) => {
                const customer = row.original;
                if (!customer.category) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <Badge
                        variant="outline"
                        className="text-xs font-medium"
                        style={{
                            borderColor: customer.category.color || undefined,
                            backgroundColor: customer.category.color
                                ? `${customer.category.color}15`
                                : undefined,
                            color: customer.category.color || undefined,
                        }}
                    >
                        {customer.category.name}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'email',
            header: 'Contacto',
            cell: ({ row }) => {
                const customer = row.original;
                return (
                    <div className="text-sm">
                        {customer.email && (
                            <p className="truncate max-w-[180px]">{customer.email}</p>
                        )}
                        {customer.mobile && (
                            <p className="text-muted-foreground">{customer.mobile}</p>
                        )}
                        {!customer.email && !customer.mobile && (
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
                const customer = row.original;
                if (!customer.city && !customer.state) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <span className="text-sm">
                        {[customer.city, customer.state].filter(Boolean).join(', ')}
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
                const customer = row.original;

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
                            <DropdownMenuItem onClick={() => setViewCustomer(customer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(customer.id)}
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
            <div className="text-destructive p-4">Error al cargar clientes</div>
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={data?.data || []}
                searchKey="lastName"
                searchPlaceholder="Buscar cliente..."
                filterSlot={categoryFilter}
            />
            <CustomerDetailDialog
                customer={viewCustomer}
                open={!!viewCustomer}
                onClose={() => setViewCustomer(null)}
            />
        </>
    );
}
