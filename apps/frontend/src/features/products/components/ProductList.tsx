import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { productsApi, categoriesApi } from '../api/products.api';
import { Product } from '../types';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
    ArrowUpDown,
    Edit,
    Trash,
    MoreHorizontal,
    AlertTriangle,
    Eye,
    History,
    Package,
    DollarSign,
    TrendingUp,
    Boxes,
    Tag,
    FileText,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { StockHistoryDialog } from './StockHistoryDialog';
import { Separator } from '@/components/ui/separator';

interface ProductListProps {
    readonly onEdit: (product: Product) => void;
    readonly onDelete: (id: string) => void;
}

/**
 * Modal para ver detalle de un producto con diseño mejorado
 */
function ProductDetailDialog({
    product,
    open,
    onClose,
    globalMinStock = 5,
}: {
    readonly product: Product | null;
    readonly open: boolean;
    readonly onClose: () => void;
    readonly globalMinStock?: number;
}) {
    if (!product) return null;

    const margin = product.profitMargin ?? 0;
    const ganancia = product.price - product.cost;
    const isLowStock = product.stock <= globalMinStock && product.stock > 0;
    const isOutOfStock = product.stock === 0;

    // Determinar el estado del stock para mostrar badge
    const getStockStatus = () => {
        if (isOutOfStock) return { label: 'Sin Stock', variant: 'destructive' as const, className: 'bg-red-500/10 text-red-600 border-red-200' };
        if (isLowStock) return { label: 'Stock Bajo', variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-300' };
        return { label: 'En Stock', variant: 'outline' as const, className: 'bg-green-500/10 text-green-600 border-green-300' };
    };
    const stockStatus = getStockStatus();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                {/* Header con gradiente y nombre del producto */}
                <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 py-5 text-primary-foreground">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Package className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold tracking-tight truncate">
                                {product.name}
                            </h2>
                            {product.category ? (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Tag className="h-3.5 w-3.5 opacity-80" />
                                    <span className="text-sm opacity-90">{product.category.name}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="p-6 space-y-5">
                    {/* Descripción si existe */}
                    {product.description ? (
                        <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Descripción
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed">{product.description}</p>
                        </div>
                    ) : null}

                    {/* Sección de precios */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Información de Precios
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Costo */}
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-800">
                                <p className="text-xs text-muted-foreground mb-1">Costo</p>
                                <p className="text-lg font-semibold">{formatCurrency(product.cost)}</p>
                            </div>

                            {/* Margen */}
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800/50">
                                <div className="flex items-center gap-1 mb-1">
                                    <TrendingUp className="h-3 w-3 text-blue-500" />
                                    <p className="text-xs text-blue-600 dark:text-blue-400">Margen</p>
                                </div>
                                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                    {margin.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Precio de venta destacado */}
                        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 p-4 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-0.5">
                                        Precio de Venta
                                    </p>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                                        Ganancia: {formatCurrency(ganancia)}/unidad
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(product.price)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Stock e información adicional */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Inventario y Estado
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Stock actual */}
                            <div className={`rounded-lg p-3 border transition-colors ${
                                (() => {
                                    if (isOutOfStock) return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50';
                                    if (isLowStock) return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/50';
                                    return 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
                                })()
                            }`}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-muted-foreground">Stock Actual</p>
                                    {(isLowStock || isOutOfStock) ? (
                                        <AlertTriangle className={`h-3.5 w-3.5 ${isOutOfStock ? 'text-red-500' : 'text-yellow-500'}`} />
                                    ) : null}
                                </div>
                                <p className={`text-lg font-semibold ${
                                    (() => {
                                        if (isOutOfStock) return 'text-red-600 dark:text-red-400';
                                        if (isLowStock) return 'text-yellow-600 dark:text-yellow-400';
                                        return '';
                                    })()
                                }`}>
                                    {product.stock} <span className="text-sm font-normal text-muted-foreground">unidades</span>
                                </p>
                            </div>

                            {/* Estado del producto */}
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-800">
                                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                                <div className="flex items-center gap-2">
                                    {product.isActive ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-medium text-green-600 dark:text-green-400">Activo</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-muted-foreground">Inactivo</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Badge de estado de stock */}
                        <div className="flex items-center justify-center pt-2">
                            <Badge
                                variant={stockStatus.variant}
                                className={`${stockStatus.className} px-4 py-1`}
                            >
                                {stockStatus.label}
                            </Badge>
                        </div>
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
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [stockStatus, setStockStatus] = useState<'all' | 'critical'>('all');

    // Query para categorías
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getAll(),
    });

    // Query para configuración global (stock mínimo)
    const { data: config } = useQuery({
        queryKey: ['configuration'],
        queryFn: async () => {
            const res = await import('@/lib/axios').then(m => m.api.get('/api/configuration'));
            return res.data as { minStockAlert: number };
        },
    });
    const globalMinStock = config?.minStockAlert ?? 5;

    const { data, isLoading, error } = useQuery({
        queryKey: ['products', { categoryId: selectedCategoryId, stockStatus }],
        queryFn: () => productsApi.getAll({
            limit: 100, // Máximo permitido por el backend
            categoryId: selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
            stockStatus: stockStatus === 'all' ? undefined : stockStatus,
        }),
    });

    // Componente de los filtros
    const filtersSlot = (
        <div className="flex items-center gap-2">
            {/* Filtro de categorías */}
            <Select
                value={selectedCategoryId || 'all'}
                onValueChange={setSelectedCategoryId}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                                {cat.color ? (
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                ) : null}
                                {cat.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Filtro de stock */}
            <Select
                value={stockStatus}
                onValueChange={(value) => setStockStatus(value as 'all' | 'critical')}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todo el stock" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todo el stock</SelectItem>
                    <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Bajo / Sin Stock
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );

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
                    </div>
                );
            },
        },
        {
            id: 'category',
            header: 'Categoría',
            cell: ({ row }) => {
                const product = row.original;
                if (!product.category) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                            borderColor: product.category.color || undefined,
                            backgroundColor: product.category.color ? `${product.category.color}20` : undefined,
                        }}
                    >
                        {product.category.name}
                        {product.category.profitMargin !== null && product.category.profitMargin !== undefined ? (
                            <span className="ml-1 text-muted-foreground">({product.category.profitMargin}%)</span>
                        ) : null}
                    </Badge>
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
            cell: ({ row }) => {
                const product = row.original;
                const profitMargin = product.profitMargin ?? 0;

                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-green-600">
                            {formatCurrency(row.getValue('price'))}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {profitMargin.toFixed(1)}% ganancia
                        </span>
                    </div>
                );
            },
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
                const isLow = stock <= globalMinStock && stock > 0;
                const isOut = stock === 0;

                return (
                    <div className="flex items-center gap-1">
                        <span className={
                            (() => {
                                if (isOut) return 'text-destructive font-medium';
                                if (isLow) return 'text-yellow-600 font-medium';
                                return '';
                            })()
                        }>
                            {stock}
                        </span>
                        {(isLow || isOut) ? (
                            <AlertTriangle className={`h-4 w-4 ${isOut ? 'text-destructive' : 'text-yellow-600'}`} />
                        ) : null}
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
                            <DropdownMenuItem onClick={() => setHistoryProduct(product)}>
                                <History className="mr-2 h-4 w-4" />
                                Historial de Stock
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

    const getRowClassName = (product: Product): string => {
        if (product.stock === 0) {
            return 'bg-destructive/5 hover:bg-destructive/10';
        }
        if (product.stock <= globalMinStock) {
            return 'bg-yellow-500/5 hover:bg-yellow-500/10';
        }
        return '';
    };

    return (
        <>
            <DataTable
                columns={columns}
                data={data?.data || []}
                searchKey="name"
                searchPlaceholder="Buscar producto..."
                filterSlot={filtersSlot}
                getRowClassName={getRowClassName}
            />
            <ProductDetailDialog
                product={viewProduct}
                open={!!viewProduct}
                onClose={() => setViewProduct(null)}
                globalMinStock={globalMinStock}
            />
            <StockHistoryDialog
                product={historyProduct}
                open={!!historyProduct}
                onClose={() => setHistoryProduct(null)}
            />
        </>
    );
}
