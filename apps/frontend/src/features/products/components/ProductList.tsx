import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { productsApi } from '../api/products.api';
import { Product } from '../types';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Edit, Trash, MoreHorizontal, AlertTriangle, Eye } from 'lucide-react';
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

interface ProductListProps {
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un producto
 */
function ProductDetailDialog({ 
    product, 
    open, 
    onClose 
}: { 
    product: Product | null; 
    open: boolean; 
    onClose: () => void;
}) {
    if (!product) return null;

    const margin = product.profitMargin ?? 0;
    const ganancia = product.price - product.cost;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{product.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Categoría */}
                    {product.category && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Categoría</span>
                            <Badge variant="outline">{product.category.name}</Badge>
                        </div>
                    )}

                    {/* Costo */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Costo</span>
                        <span className="font-medium">{formatCurrency(product.cost)}</span>
                    </div>

                    {/* Margen */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">% Ganancia</span>
                        <span className="font-medium">{margin.toFixed(2)}%</span>
                    </div>

                    {/* Precio de venta - destacado */}
                    <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-green-800 dark:text-green-200">
                                Precio de Venta
                            </span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(product.price)}
                            </span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Ganancia: {formatCurrency(ganancia)} por unidad
                        </p>
                    </div>

                    {/* Stock */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Stock Actual</span>
                        <span className={`font-medium ${
                            product.stock === 0 ? 'text-destructive' :
                            product.stock <= product.minStock ? 'text-yellow-600' : ''
                        }`}>
                            {product.stock} unidades
                        </span>
                    </div>

                    {product.minStock > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Stock Mínimo</span>
                            <span className="font-medium">{product.minStock}</span>
                        </div>
                    )}

                    {/* Estado */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estado</span>
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Componente para mostrar la lista de productos con acciones
 */
export function ProductList({ onEdit, onDelete }: ProductListProps) {
    const [viewProduct, setViewProduct] = useState<Product | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: () => productsApi.getAll(),
    });

    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Producto
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div>
                        <p className="font-medium">{product.name}</p>
                        {product.category && (
                            <p className="text-xs text-muted-foreground">{product.category.name}</p>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'cost',
            header: 'Costo',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {formatCurrency(row.getValue('cost'))}
                </span>
            ),
        },
        {
            accessorKey: 'price',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Precio
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">
                    {formatCurrency(row.getValue('price'))}
                </span>
            ),
        },
        {
            accessorKey: 'stock',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Stock
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const stock = row.original.stock;
                const minStock = row.original.minStock;
                const isLow = stock <= minStock && stock > 0;
                const isOut = stock === 0;

                return (
                    <div className="flex items-center gap-1">
                        <span className={
                            isOut ? 'text-destructive font-medium' :
                            isLow ? 'text-yellow-600 font-medium' : ''
                        }>
                            {stock}
                        </span>
                        {(isLow || isOut) && (
                            <AlertTriangle className={`h-4 w-4 ${isOut ? 'text-destructive' : 'text-yellow-600'}`} />
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const product = row.original;

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
                            <DropdownMenuItem onClick={() => setViewProduct(product)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(product.id)}
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

    if (isLoading) return <div className="flex items-center justify-center p-8">Cargando...</div>;
    if (error) return <div className="text-destructive p-4">Error al cargar productos</div>;

    return (
        <>
            <DataTable
                columns={columns}
                data={data?.data || []}
                searchKey="name"
                searchPlaceholder="Buscar producto..."
            />
            <ProductDetailDialog 
                product={viewProduct} 
                open={!!viewProduct} 
                onClose={() => setViewProduct(null)} 
            />
        </>
    );
}
