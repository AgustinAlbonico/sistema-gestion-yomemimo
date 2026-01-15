import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    User,
    ShoppingCart,
    Trash2,
    PlayCircle,
    AlertCircle
} from 'lucide-react';
import { ParkedSale } from '../hooks/useParkedSales';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ParkedSalesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parkedSales: ParkedSale[];
    onSelect: (sale: ParkedSale) => void;
    onDelete: (id: string) => void;
}

export function ParkedSalesDialog({
    open,
    onOpenChange,
    parkedSales,
    onSelect,
    onDelete,
}: ParkedSalesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        Ventas Pendientes
                    </DialogTitle>
                    <DialogDescription>
                        Seleccioná una venta para retomarla o eliminala si ya no sirve.
                    </DialogDescription>
                </DialogHeader>

                {parkedSales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                        <p>No hay ventas pendientes</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[300px] -mx-4 px-4">
                        <div className="space-y-3">
                            {parkedSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                                >
                                    <div className="flex-1 min-w-0 mr-3 cursor-pointer" onClick={() => onSelect(sale)}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium truncate flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                {sale.customerName}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] font-normal">
                                                {format(new Date(sale.date), "HH:mm 'hs'", { locale: es })}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                                <ShoppingCart className="h-3 w-3" />
                                                {sale.itemCount} prod.
                                            </span>
                                            <span>•</span>
                                            <span className="font-medium text-emerald-600">
                                                ${sale.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={() => onSelect(sale)}
                                        >
                                            <PlayCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => onDelete(sale.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
