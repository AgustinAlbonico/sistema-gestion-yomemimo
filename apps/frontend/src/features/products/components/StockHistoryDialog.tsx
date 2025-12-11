/**
 * Componente para mostrar el historial de stock de un producto
 */
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Package, 
    ShoppingCart,
    Receipt,
    RotateCcw,
    Settings,
    Loader2 
} from 'lucide-react';
import { inventoryApi } from '../api/inventory.api';
import { Product, StockMovement, StockMovementType, StockMovementSource } from '../types';
import { formatCurrency } from '@/lib/utils';
import { formatDateForDisplay } from '@/lib/date-utils';

interface StockHistoryDialogProps {
    product: Product | null;
    open: boolean;
    onClose: () => void;
}

/**
 * Mapea el source a un label legible
 */
function getSourceLabel(source: StockMovementSource): string {
    const labels: Record<StockMovementSource, string> = {
        [StockMovementSource.INITIAL_LOAD]: 'Carga Inicial',
        [StockMovementSource.PURCHASE]: 'Compra',
        [StockMovementSource.SALE]: 'Venta',
        [StockMovementSource.ADJUSTMENT]: 'Ajuste',
        [StockMovementSource.RETURN]: 'Devolución',
    };
    return labels[source] || source;
}

/**
 * Obtiene el icono según el source
 */
function getSourceIcon(source: StockMovementSource) {
    const icons: Record<StockMovementSource, React.ReactNode> = {
        [StockMovementSource.INITIAL_LOAD]: <Package className="h-4 w-4" />,
        [StockMovementSource.PURCHASE]: <ShoppingCart className="h-4 w-4" />,
        [StockMovementSource.SALE]: <Receipt className="h-4 w-4" />,
        [StockMovementSource.ADJUSTMENT]: <Settings className="h-4 w-4" />,
        [StockMovementSource.RETURN]: <RotateCcw className="h-4 w-4" />,
    };
    return icons[source] || <Package className="h-4 w-4" />;
}

/**
 * Obtiene el color del badge según el source
 */
function getSourceVariant(source: StockMovementSource): 'default' | 'secondary' | 'outline' | 'destructive' {
    switch (source) {
        case StockMovementSource.INITIAL_LOAD:
            return 'default';
        case StockMovementSource.PURCHASE:
            return 'default';
        case StockMovementSource.SALE:
            return 'secondary';
        case StockMovementSource.RETURN:
            return 'outline';
        case StockMovementSource.ADJUSTMENT:
            return 'outline';
        default:
            return 'secondary';
    }
}

/**
 * Componente para un item del historial
 */
function StockMovementItem({ movement }: { movement: StockMovement }) {
    const isEntry = movement.type === StockMovementType.IN;
    
    return (
        <div className="flex items-start gap-3 py-3">
            {/* Icono de entrada/salida */}
            <div className={`mt-0.5 ${isEntry ? 'text-green-600' : 'text-red-600'}`}>
                {isEntry ? (
                    <ArrowUpCircle className="h-5 w-5" />
                ) : (
                    <ArrowDownCircle className="h-5 w-5" />
                )}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Cantidad */}
                    <span className={`font-semibold ${isEntry ? 'text-green-600' : 'text-red-600'}`}>
                        {isEntry ? '+' : '-'}{movement.quantity} unidades
                    </span>

                    {/* Badge de origen */}
                    <Badge variant={getSourceVariant(movement.source)} className="text-xs gap-1">
                        {getSourceIcon(movement.source)}
                        {getSourceLabel(movement.source)}
                    </Badge>
                </div>

                {/* Detalles */}
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    {movement.provider && (
                        <p>Proveedor: {movement.provider}</p>
                    )}
                    {movement.cost && (
                        <p>Costo unitario: {formatCurrency(movement.cost)}</p>
                    )}
                    {movement.referenceId && (
                        <p>Referencia: {movement.referenceId}</p>
                    )}
                    {movement.notes && (
                        <p className="italic">{movement.notes}</p>
                    )}
                </div>

                {/* Fecha */}
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDateForDisplay(movement.date)}
                </p>
            </div>
        </div>
    );
}

/**
 * Dialog para mostrar el historial de stock de un producto
 */
export function StockHistoryDialog({ product, open, onClose }: StockHistoryDialogProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['stock-history', product?.id],
        queryFn: () => inventoryApi.getProductHistory(product!.id),
        enabled: !!product?.id && open,
    });

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Historial de Stock
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{product.name}</p>
                </DialogHeader>

                {/* Stock actual */}
                <div className="rounded-lg bg-muted p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Stock Actual</span>
                        <span className="text-2xl font-bold">{data?.product?.stock ?? product.stock}</span>
                    </div>
                </div>

                <Separator />

                {/* Lista de movimientos */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-destructive">
                        Error al cargar el historial
                    </div>
                ) : data?.movements && data.movements.length > 0 ? (
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="divide-y">
                            {data.movements.map((movement) => (
                                <StockMovementItem key={movement.id} movement={movement} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay movimientos de stock registrados</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
