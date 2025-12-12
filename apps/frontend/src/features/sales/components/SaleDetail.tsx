/**
 * Detalle de venta en un diálogo
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, CreditCard, FileText, Receipt, AlertTriangle } from 'lucide-react';
import {
    Sale,
    SaleStatusLabels,
    SaleStatusColors,
    PaymentMethodLabels,
    InvoiceStatus,
} from '../types';
import { formatDateForDisplay } from '@/lib/date-utils';
import { InvoiceActions } from './InvoiceActions';

interface SaleDetailProps {
    readonly sale: Sale;
    readonly open: boolean;
    readonly onClose: () => void;
}

/**
 * Formatea un número como moneda ARS
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(value);
}

export function SaleDetail({ sale, open, onClose }: SaleDetailProps) {
    /**
     * Obtiene el nombre del cliente
     */
    const getCustomerName = (): string => {
        if (sale.customer) {
            return `${sale.customer.firstName} ${sale.customer.lastName}`;
        }
        return sale.customerName || 'Consumidor Final';
    };

    /**
     * Obtiene el nombre del vendedor
     */
    const getSellerName = (): string => {
        if (sale.createdBy) {
            return `${sale.createdBy.firstName} ${sale.createdBy.lastName}`;
        }
        return '-';
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">
                                Venta {sale.saleNumber}
                            </DialogTitle>
                            <DialogDescription>
                                Detalle completo de la venta
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={SaleStatusColors[sale.status]}>
                                {SaleStatusLabels[sale.status]}
                            </Badge>
                            {/* Mostrar si hay error de facturación */}
                            {(sale.fiscalPending || 
                              sale.invoice?.status === InvoiceStatus.REJECTED || 
                              sale.invoice?.status === InvoiceStatus.ERROR) && (
                                <Badge 
                                    variant="outline" 
                                    className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700"
                                >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Error Factura
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información general */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Fecha</p>
                                <p className="font-medium">
                                    {formatDateForDisplay(sale.saleDate)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Cliente</p>
                                <p className="font-medium">{getCustomerName()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Vendedor</p>
                                <p className="font-medium">{getSellerName()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Tipo</p>
                                <p className="font-medium">
                                    {sale.isOnAccount ? 'Cuenta Corriente' : 'Contado'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Items de la venta */}
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Productos ({sale.items?.length || 0})
                        </h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-center">Cant.</TableHead>
                                    <TableHead className="text-right">P. Unit.</TableHead>
                                    <TableHead className="text-right">Desc.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {item.productDescription}
                                                </p>
                                                {item.productCode && (
                                                    <p className="text-xs text-muted-foreground">
                                                        SKU: {item.productCode}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.unitPrice)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.discount > 0
                                                ? formatCurrency(item.discount)
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(item.subtotal)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <Separator />

                    {/* Totales */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>
                            {sale.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Descuento:</span>
                                    <span>-{formatCurrency(sale.discount)}</span>
                                </div>
                            )}
                            {sale.tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Impuestos:</span>
                                    <span>{formatCurrency(sale.tax)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(sale.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pagos */}
                    {sale.payments && sale.payments.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Pagos ({sale.payments.length})
                                </h3>
                                <div className="space-y-2">
                                    {sale.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {PaymentMethodLabels[payment.paymentMethod]}
                                                </p>
                                                {payment.installments && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {payment.installments} cuotas
                                                    </p>
                                                )}
                                                {payment.cardLastFourDigits && (
                                                    <p className="text-xs text-muted-foreground">
                                                        **** {payment.cardLastFourDigits}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="font-medium">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notas */}
                    {sale.notes && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="font-semibold mb-2">Notas</h3>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                    {sale.notes}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Facturación */}
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Facturación
                        </h3>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <InvoiceActions sale={sale} invoice={sale.invoice} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

