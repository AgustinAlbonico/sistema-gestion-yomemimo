/**
 * Modal de Confirmación de Venta
 * Muestra detalles de la venta creada, cálculo de cambio y opciones de comprobante
 */
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    FileText,
    User,
    Calendar,
    CreditCard,
    Banknote,
    Building,
    Smartphone,
    Receipt,
    Download,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { Sale, PaymentMethod, PaymentMethodLabels, InvoiceStatus, InvoiceTypeLabels } from '../types';
import { formatDateForDisplay } from '@/lib/date-utils';
import { invoicesApi } from '../api/sales.api';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface SaleConfirmationModalProps {
    readonly sale: Sale | null;
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

/**
 * Iconos para métodos de pago
 */
import { PaymentMethodIcons } from '../constants';

export function SaleConfirmationModal({
    sale,
    open,
    onClose,
}: SaleConfirmationModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    if (!sale) return null;

    // Calcular el total pagado y el cambio
    const totalPaid = sale.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const change = totalPaid - sale.total;
    const hasChange = change > 0.01; // Considerar cambio solo si es mayor a 1 centavo

    // Verificar si algún pago fue en efectivo
    const hasCashPayment = sale.payments?.some(p => p.paymentMethod === PaymentMethod.CASH) || false;

    // Determinar el tipo de comprobante
    const isFiscal = sale.isFiscal || sale.invoice?.status === InvoiceStatus.AUTHORIZED;
    const hasFiscalError = sale.fiscalPending ||
        sale.invoice?.status === InvoiceStatus.REJECTED ||
        sale.invoice?.status === InvoiceStatus.ERROR;

    /**
     * Descarga el PDF de la factura fiscal
     */
    const handleDownloadInvoicePdf = async () => {
        if (!sale.invoice?.id) return;

        try {
            setIsDownloading(true);
            const response = await api.get(invoicesApi.getInvoicePdf(sale.invoice.id), {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `factura-${String(sale.invoice.pointOfSale).padStart(4, '0')}-${String(sale.invoice.invoiceNumber).padStart(8, '0')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Factura descargada');
        } catch {
            toast.error('Error al descargar la factura');
        } finally {
            setIsDownloading(false);
        }
    };

    /**
     * Descarga el PDF de la nota de venta (no fiscal)
     */
    const handleDownloadSaleNote = async () => {
        try {
            setIsDownloading(true);
            const response = await api.get(invoicesApi.getSaleNotePdfUrl(sale.id), {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `nota-venta-${sale.saleNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Nota de venta descargada');
        } catch {
            toast.error('Error al descargar la nota de venta');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">¡Venta Registrada!</DialogTitle>
                                <DialogDescription className="text-base">
                                    La venta se registró exitosamente
                                </DialogDescription>
                            </div>
                        </div>
                        {/* Indicador de tipo de comprobante */}
                        <div className="flex flex-col items-end gap-1">
                            {isFiscal && sale.invoice ? (
                                <>
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                        {InvoiceTypeLabels[sale.invoice.invoiceType]} - Autorizada
                                    </Badge>
                                    {sale.invoice.invoiceNumber && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {String(sale.invoice.pointOfSale).padStart(4, '0')}-{String(sale.invoice.invoiceNumber).padStart(8, '0')}
                                        </span>
                                    )}
                                    {sale.invoice.cae && (
                                        <span className="text-xs text-muted-foreground">
                                            CAE: {sale.invoice.cae}
                                        </span>
                                    )}
                                </>
                            ) : hasFiscalError ? (
                                <>
                                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Error en Factura
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Se emitirá Nota de Venta
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Badge variant="secondary">
                                        Nota de Venta
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Documento no fiscal
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Información básica */}
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Número de Venta</span>
                                <Badge variant="outline" className="font-mono">
                                    {sale.saleNumber}
                                </Badge>
                            </div>

                            {sale.customer && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Cliente
                                    </span>
                                    <span className="font-medium">
                                        {sale.customer.firstName} {sale.customer.lastName}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Fecha
                                </span>
                                <span className="font-medium">
                                    {formatDateForDisplay(sale.saleDate.toString())}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Productos */}
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Productos
                            </h3>
                            <div className="space-y-2">
                                {sale.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-start text-sm border-b last:border-0 pb-2 last:pb-0"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">{item.productDescription}</div>
                                            <div className="text-muted-foreground">
                                                {item.quantity} x {formatCurrency(item.unitPrice)}
                                            </div>
                                        </div>
                                        <div className="font-semibold">
                                            {formatCurrency(item.subtotal)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Totales */}
                    <Card className="border-2 border-primary/20">
                        <CardContent className="pt-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>

                            {sale.discount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Descuento</span>
                                    <span className="text-red-600">-{formatCurrency(sale.discount)}</span>
                                </div>
                            )}

                            {sale.tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Impuestos</span>
                                    <span>+{formatCurrency(sale.tax)}</span>
                                </div>
                            )}

                            <Separator />

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-lg font-bold">TOTAL</span>
                                <span className="text-2xl font-bold text-primary">
                                    {formatCurrency(sale.total)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagos */}
                    {sale.payments && sale.payments.length > 0 && (
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-3">Forma de Pago</h3>
                                <div className="space-y-2">
                                    {sale.payments.map((payment, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                {PaymentMethodIcons[payment.paymentMethod]}
                                                <span>{PaymentMethodLabels[payment.paymentMethod]}</span>
                                            </div>
                                            <span className="font-medium">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cambio (solo si aplica) */}
                    {hasChange && hasCashPayment && (
                        <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold text-green-900 dark:text-green-100">
                                            Cambio a Devolver
                                        </div>
                                        <div className="text-sm text-green-700 dark:text-green-300">
                                            Total pagado: {formatCurrency(totalPaid)}
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(change)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        {isFiscal && sale.invoice ? (
                            <Button
                                onClick={handleDownloadInvoicePdf}
                                disabled={isDownloading}
                                variant="outline"
                                className="flex-1"
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Descargar Factura
                            </Button>
                        ) : (
                            <Button
                                onClick={handleDownloadSaleNote}
                                disabled={isDownloading}
                                variant="outline"
                                className="flex-1"
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Descargar Nota de Venta
                            </Button>
                        )}
                        <Button onClick={onClose} className="flex-1 bg-primary">
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
