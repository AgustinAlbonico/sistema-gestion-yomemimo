/**
 * Componente de detalle de compra
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Receipt, Package, User, Calendar, Hash, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Purchase,
    PurchaseStatusLabels,
    PurchaseStatusColors,
    PaymentMethodLabels,
} from '../types';
import { formatDateForDisplay } from '@/lib/date-utils';

interface PurchaseDetailProps {
    readonly purchase: Purchase;
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

export function PurchaseDetail({ purchase, open, onClose }: PurchaseDetailProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Compra {purchase.purchaseNumber}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Estado y badges */}
                    <div className="flex flex-wrap gap-2">
                        <Badge className={PurchaseStatusColors[purchase.status]}>
                            {PurchaseStatusLabels[purchase.status]}
                        </Badge>
                        {purchase.inventoryUpdated && (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                                Stock Actualizado
                            </Badge>
                        )}
                        {purchase.expenseCreated && (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                                Gasto Registrado
                            </Badge>
                        )}
                    </div>

                    {/* Info general */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Proveedor */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Proveedor
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium text-lg">{purchase.providerName}</p>
                                {purchase.providerDocument && (
                                    <p className="text-sm text-muted-foreground">
                                        CUIT/DNI: {purchase.providerDocument}
                                    </p>
                                )}
                                {purchase.providerPhone && (
                                    <p className="text-sm text-muted-foreground">
                                        Tel: {purchase.providerPhone}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Datos de compra */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Datos de Compra
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Fecha:</span>
                                    <span className="font-medium">
                                        {formatDateForDisplay(purchase.purchaseDate, 'long')}
                                    </span>
                                </div>
                                {purchase.invoiceNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Factura:</span>
                                        <span className="font-mono">{purchase.invoiceNumber}</span>
                                    </div>
                                )}
                                {purchase.paymentMethod && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Método de pago:
                                        </span>
                                        <span>{PaymentMethodLabels[purchase.paymentMethod]}</span>
                                    </div>
                                )}
                                {purchase.paidAt && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Fecha de pago:
                                        </span>
                                        <span>
                                            {formatDateForDisplay(purchase.paidAt, 'short')}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Productos ({purchase.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-center">Cantidad</TableHead>
                                        <TableHead className="text-right">Precio Unit.</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <p className="font-medium">{item.product.name}</p>
                                                {item.product.sku && (
                                                    <p className="text-xs text-muted-foreground">
                                                        SKU: {item.product.sku}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.unitPrice)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(item.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Totales */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span>{formatCurrency(purchase.subtotal)}</span>
                                </div>
                                {purchase.tax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Impuestos:</span>
                                        <span>+ {formatCurrency(purchase.tax)}</span>
                                    </div>
                                )}
                                {purchase.discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Descuento:</span>
                                        <span className="text-green-600">
                                            - {formatCurrency(purchase.discount)}
                                        </span>
                                    </div>
                                )}
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="font-semibold text-lg">TOTAL:</span>
                                    <span className="font-bold text-lg text-primary">
                                        {formatCurrency(purchase.total)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    {purchase.notes && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Notas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {purchase.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground border-t pt-4">
                        <p>
                            Registrado por:{' '}
                            {purchase.createdBy
                                ? `${purchase.createdBy.firstName} ${purchase.createdBy.lastName}`
                                : 'Sistema'}
                        </p>
                        <p>
                            Creado: {format(new Date(purchase.createdAt), 'PPpp', { locale: es })}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

