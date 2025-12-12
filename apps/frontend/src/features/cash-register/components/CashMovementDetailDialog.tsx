import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { CashMovement } from '../types';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';
import { ArrowDownLeft, ArrowUpRight, Calendar, Clock, User, FileText, CreditCard, Package, Loader2, ShoppingCart, Receipt } from 'lucide-react';
import { purchasesApi } from '@/features/purchases/api/purchases.api';
import { salesApi } from '@/features/sales/api/sales.api';
import { Purchase, PurchaseStatusLabels, PurchaseStatusColors } from '@/features/purchases/types';
import { Sale, SaleStatusLabels, SaleStatusColors, InvoiceStatus } from '@/features/sales/types';
import { formatDateForDisplay } from '@/lib/date-utils';

interface CashMovementDetailDialogProps {
    readonly movement: CashMovement | null;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
}

export function CashMovementDetailDialog({ movement, open, onOpenChange }: CashMovementDetailDialogProps) {
    const [purchaseDetails, setPurchaseDetails] = useState<Purchase | null>(null);
    const [saleDetails, setSaleDetails] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(false);

    // Cargar detalles de compra si el movimiento es de tipo purchase
    useEffect(() => {
        if (open && movement?.referenceType === 'purchase' && movement?.referenceId) {
            setLoading(true);
            purchasesApi.getOne(movement.referenceId)
                .then(data => {
                    setPurchaseDetails(data);
                })
                .catch(err => {
                    console.error('Error cargando detalles de compra:', err);
                    setPurchaseDetails(null);
                })
                .finally(() => setLoading(false));
        } else {
            setPurchaseDetails(null);
        }
    }, [open, movement?.referenceType, movement?.referenceId]);

    // Cargar detalles de venta si el movimiento es de tipo sale o sale_payment
    useEffect(() => {
        if (open && (movement?.referenceType === 'sale' || movement?.referenceType === 'sale_payment') && movement?.referenceId) {
            setLoading(true);
            salesApi.getOne(movement.referenceId)
                .then(data => {
                    setSaleDetails(data);
                })
                .catch(err => {
                    console.error('Error cargando detalles de venta:', err);
                    setSaleDetails(null);
                })
                .finally(() => setLoading(false));
        } else {
            setSaleDetails(null);
        }
    }, [open, movement?.referenceType, movement?.referenceId]);

    if (!movement) return null;

    const isIncome = movement.movementType === 'income';
    const amount = Number(movement.amount);
    const isPurchase = movement.referenceType === 'purchase';
    const isSale = movement.referenceType === 'sale' || movement.referenceType === 'sale_payment';
    const hasDetails = (isPurchase && purchaseDetails) || (isSale && saleDetails);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={hasDetails ? "sm:max-w-3xl max-h-[90vh] overflow-y-auto" : "sm:max-w-md"}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Badge
                            variant={isIncome ? 'default' : 'destructive'}
                            className={`text-xs px-2 py-0.5 font-medium ${
                                isIncome 
                                    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200' 
                                    : 'bg-rose-500/15 text-rose-700 border-rose-200'
                            }`}
                        >
                            {isIncome ? (
                                <ArrowDownLeft className="h-3 w-3 mr-1" />
                            ) : (
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                            )}
                            {isIncome ? 'INGRESO' : 'EGRESO'}
                        </Badge>
                        <span>
                            {isPurchase && purchaseDetails 
                                ? `Compra ${purchaseDetails.purchaseNumber}` 
                                : 'Detalle del Movimiento'}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Monto destacado */}
                    <div className={`text-center p-4 rounded-lg ${
                        isIncome ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                        <span className={`font-mono font-bold text-3xl ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                            {isIncome ? '+' : '-'} {formatCurrency(Math.abs(amount))}
                        </span>
                    </div>

                    {/* Detalles de compra */}
                    {isPurchase && loading && (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Cargando detalles...</span>
                        </div>
                    )}

                    {isPurchase && purchaseDetails && !loading && (
                        <div className="space-y-4">
                            {/* Estado de la compra */}
                            <div className="flex flex-wrap gap-2">
                                <Badge className={PurchaseStatusColors[purchaseDetails.status]}>
                                    {PurchaseStatusLabels[purchaseDetails.status]}
                                </Badge>
                                {purchaseDetails.inventoryUpdated && (
                                    <Badge variant="outline" className="border-green-500 text-green-600">
                                        Stock Actualizado
                                    </Badge>
                                )}
                            </div>

                            {/* Info del Proveedor */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Proveedor
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-medium">{purchaseDetails.providerName}</p>
                                    {purchaseDetails.providerDocument && (
                                        <p className="text-sm text-muted-foreground">
                                            CUIT/DNI: {purchaseDetails.providerDocument}
                                        </p>
                                    )}
                                    {purchaseDetails.providerPhone && (
                                        <p className="text-sm text-muted-foreground">
                                            Tel: {purchaseDetails.providerPhone}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Datos de la Compra */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        Datos de la Compra
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Fecha:</span>
                                        <span className="font-medium">
                                            {formatDateForDisplay(purchaseDetails.purchaseDate, 'long')}
                                        </span>
                                    </div>
                                    {purchaseDetails.invoiceNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Factura:</span>
                                            <span className="font-mono">{purchaseDetails.invoiceNumber}</span>
                                        </div>
                                    )}
                                    {purchaseDetails.paidAt && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Fecha de pago:</span>
                                            <span>{formatDateForDisplay(purchaseDetails.paidAt, 'short')}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Items de la compra */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Productos ({purchaseDetails.items.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center">Cant.</TableHead>
                                                <TableHead className="text-right">P. Unit.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {purchaseDetails.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <p className="font-medium text-sm">{item.product.name}</p>
                                                        {item.product.sku && (
                                                            <p className="text-xs text-muted-foreground">
                                                                SKU: {item.product.sku}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {formatCurrency(item.unitPrice)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-sm">
                                                        {formatCurrency(item.subtotal)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Totales */}
                                    <div className="mt-4 pt-4 border-t space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span>{formatCurrency(purchaseDetails.subtotal)}</span>
                                        </div>
                                        {purchaseDetails.tax > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Impuestos:</span>
                                                <span>+ {formatCurrency(purchaseDetails.tax)}</span>
                                            </div>
                                        )}
                                        {purchaseDetails.discount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Descuento:</span>
                                                <span className="text-green-600">- {formatCurrency(purchaseDetails.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-semibold pt-2 border-t">
                                            <span>TOTAL:</span>
                                            <span className="text-primary">{formatCurrency(purchaseDetails.total)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notas */}
                            {purchaseDetails.notes && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Notas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {purchaseDetails.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Detalles de la venta */}
                    {isSale && loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Cargando detalles de venta...</span>
                        </div>
                    )}

                    {isSale && saleDetails && !loading && (
                        <div className="space-y-4">
                            {/* Información del cliente y estado */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            Venta #{saleDetails.saleNumber}
                                        </CardTitle>
                                        <Badge className={SaleStatusColors[saleDetails.status]}>
                                            {SaleStatusLabels[saleDetails.status]}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Cliente</p>
                                            <p className="font-medium">{saleDetails.customer?.name || 'Consumidor Final'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Fecha</p>
                                            <p className="font-medium">{formatDateForDisplay(saleDetails.saleDate)}</p>
                                        </div>
                                        {saleDetails.invoice && (
                                            <>
                                                <div>
                                                    <p className="text-muted-foreground">Factura</p>
                                                    <p className="font-medium">
                                                        {saleDetails.invoice.invoiceType} {saleDetails.invoice.pointOfSale?.toString().padStart(4, '0')}-{saleDetails.invoice.invoiceNumber?.toString().padStart(8, '0')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Estado Factura</p>
                                                    <Badge variant={saleDetails.invoice.status === InvoiceStatus.AUTHORIZED ? 'default' : 'secondary'}>
                                                        {saleDetails.invoice.status === InvoiceStatus.AUTHORIZED ? 'Autorizada' : 
                                                         saleDetails.invoice.status === InvoiceStatus.PENDING ? 'Pendiente' :
                                                         saleDetails.invoice.status === InvoiceStatus.REJECTED ? 'Rechazada' : 'Nota de Venta'}
                                                    </Badge>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Productos de la venta */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Productos ({saleDetails.items?.length || 0})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center">Cant.</TableHead>
                                                <TableHead className="text-right">P. Unit.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {saleDetails.items?.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <p className="font-medium text-sm">{item.product?.name || 'Producto'}</p>
                                                        {item.product?.sku && (
                                                            <p className="text-xs text-muted-foreground">
                                                                SKU: {item.product.sku}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {formatCurrency(item.unitPrice)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-sm">
                                                        {formatCurrency(item.subtotal)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Totales */}
                                    <div className="mt-4 pt-4 border-t space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span>{formatCurrency(saleDetails.subtotal)}</span>
                                        </div>
                                        {Number(saleDetails.tax) > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Impuestos:</span>
                                                <span>+ {formatCurrency(saleDetails.tax)}</span>
                                            </div>
                                        )}
                                        {Number(saleDetails.discount) > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Descuento:</span>
                                                <span className="text-green-600">- {formatCurrency(saleDetails.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-semibold pt-2 border-t">
                                            <span>TOTAL:</span>
                                            <span className="text-primary">{formatCurrency(saleDetails.total)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notas */}
                            {saleDetails.notes && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Notas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {saleDetails.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Detalles generales del movimiento (si no es compra/venta o aún no se cargó) */}
                    {(!hasDetails && !loading) && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Descripción</p>
                                    <p className="font-medium">{movement.description}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Método de Pago</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`p-1 rounded-full ${
                                            isIncome ? 'text-emerald-600 bg-emerald-100' : 'text-rose-600 bg-rose-100'
                                        }`}>
                                            {getPaymentMethodIcon(movement.paymentMethod?.code || '', 'h-3 w-3')}
                                        </div>
                                        <span className="font-medium">{movement.paymentMethod?.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Fecha</p>
                                        <p className="font-medium text-sm">
                                            {new Date(movement.createdAt).toLocaleDateString('es-AR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Hora</p>
                                        <p className="font-medium text-sm">
                                            {new Date(movement.createdAt).toLocaleTimeString('es-AR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Registrado por</p>
                                    <p className="font-medium">
                                        {movement.createdBy?.name || 'Sistema'}
                                    </p>
                                </div>
                            </div>

                            {movement.referenceType && (
                                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Referencia</p>
                                        <p className="font-medium text-sm">
                                            {movement.referenceType === 'sale_payment' ? 'Pago de Venta' : 
                                             movement.referenceType === 'expense' ? 'Gasto' :
                                             movement.referenceType === 'purchase' ? 'Compra' : 
                                             movement.referenceType}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Siempre mostrar info de método de pago y fecha/hora para compras cargadas */}
                    {isPurchase && purchaseDetails && !loading && (
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Método de Pago</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`p-1 rounded-full ${
                                            isIncome ? 'text-emerald-600 bg-emerald-100' : 'text-rose-600 bg-rose-100'
                                        }`}>
                                            {getPaymentMethodIcon(movement.paymentMethod?.code || '', 'h-3 w-3')}
                                        </div>
                                        <span className="font-medium">{movement.paymentMethod?.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Registrado</p>
                                        <p className="font-medium text-sm">
                                            {new Date(movement.createdAt).toLocaleDateString('es-AR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Hora</p>
                                        <p className="font-medium text-sm">
                                            {new Date(movement.createdAt).toLocaleTimeString('es-AR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Registrado por</p>
                                    <p className="font-medium">
                                        {movement.createdBy?.name || 'Sistema'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Siempre mostrar info de método de pago y fecha/hora para ventas cargadas */}
                    {isSale && saleDetails && !loading && (
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Método de Pago</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="p-1 rounded-full text-emerald-600 bg-emerald-100">
                                            {getPaymentMethodIcon(movement.paymentMethod?.code || '', 'h-3 w-3')}
                                        </div>
                                        <span className="font-medium">{movement.paymentMethod?.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Registrado</p>
                                        <p className="font-medium text-sm">
                                            {new Date(movement.createdAt).toLocaleDateString('es-AR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Hora</p>
                                        <p className="font-medium text-sm">
                                            {new Date(movement.createdAt).toLocaleTimeString('es-AR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Registrado por</p>
                                    <p className="font-medium">
                                        {movement.createdBy?.name || 'Sistema'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
