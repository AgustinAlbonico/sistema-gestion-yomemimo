/**
 * Diálogo de detalle de venta
 * Muestra información completa de una venta específica
 * Permite marcar ventas pendientes como pagadas
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Package, DollarSign, Calendar, User, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { salesApi } from '@/features/sales/api/sales.api';
import {
    SaleStatus,
    SaleStatusLabels,
    SaleStatusColors,
} from '@/features/sales/types';
import { usePaymentMethods } from '@/features/configuration/hooks/use-payment-methods';

interface SaleDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    saleId: string | null;
    onSalePaid?: () => void; // Callback cuando se marca como pagada
}

export function SaleDetailDialog({
    open,
    onOpenChange,
    saleId,
    onSalePaid,
}: SaleDetailDialogProps) {
    const queryClient = useQueryClient();
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

    const { data: paymentMethods } = usePaymentMethods();

    const { data: sale, isLoading } = useQuery({
        queryKey: ['sale', saleId],
        queryFn: () => (saleId ? salesApi.getOne(saleId) : null),
        enabled: open && !!saleId,
    });

    const markAsPaidMutation = useMutation({
        mutationFn: async (params: { saleId: string; paymentMethodId: string }) => {
            // El backend espera paymentMethodId (UUID), no el código del método
            const response = await salesApi.markAsPaid(params.saleId, [
                {
                    paymentMethodId: params.paymentMethodId,
                    amount: Number(sale?.total || 0),
                } as any, // Usamos any porque el tipo original espera paymentMethod pero backend espera paymentMethodId
            ]);
            return response;
        },
        onSuccess: () => {
            toast.success('Venta marcada como pagada');
            queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['customer-sales'] });
            queryClient.invalidateQueries({ queryKey: ['customerAccounts', 'statement'] });
            setShowPaymentForm(false);
            setSelectedPaymentMethod('');
            onSalePaid?.();
        },
        onError: (error: Error) => {
            toast.error(`Error al marcar como pagada: ${error.message}`);
        },
    });

    const handleMarkAsPaid = () => {
        if (!saleId || !selectedPaymentMethod) return;
        markAsPaidMutation.mutate({ saleId, paymentMethodId: selectedPaymentMethod });
    };

    // Verificar si la venta puede ser marcada como pagada
    const canMarkAsPaid = sale &&
        sale.isOnAccount &&
        (sale.status === SaleStatus.PENDING || sale.status === SaleStatus.PARTIAL);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Detalle de Venta
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <p className="text-muted-foreground">Cargando detalles...</p>
                    </div>
                ) : sale ? (
                    <div className="space-y-6">
                        {/* Header con número y estado */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">{sale.saleNumber}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(sale.saleDate), "d 'de' MMMM 'de' yyyy", {
                                        locale: es,
                                    })}
                                </p>
                            </div>
                            <Badge
                                className={SaleStatusColors[sale.status as SaleStatus]}
                            >
                                {SaleStatusLabels[sale.status as SaleStatus]}
                            </Badge>
                        </div>

                        {/* Cliente */}
                        {(sale.customer || sale.customerName) && (
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {sale.customer
                                        ? `${sale.customer.firstName} ${sale.customer.lastName}`
                                        : sale.customerName}
                                </span>
                            </div>
                        )}

                        <Separator />

                        {/* Items de la venta */}
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                                <Package className="h-4 w-4" />
                                Productos ({sale.items.length})
                            </h4>
                            <div className="space-y-2">
                                {sale.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {item.productDescription}
                                            </p>
                                            {item.productCode && (
                                                <p className="text-xs text-muted-foreground">
                                                    SKU: {item.productCode}
                                                </p>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                ${Number(item.subtotal).toFixed(2)}
                                            </p>
                                            {item.discount > 0 && (
                                                <p className="text-xs text-green-600">
                                                    -${Number(item.discount).toFixed(2)} desc.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Totales */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${Number(sale.subtotal).toFixed(2)}</span>
                            </div>
                            {sale.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Descuento</span>
                                    <span>-${Number(sale.discount).toFixed(2)}</span>
                                </div>
                            )}
                            {sale.tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Impuestos</span>
                                    <span>${Number(sale.tax).toFixed(2)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>${Number(sale.total).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Pagos (si hay) */}
                        {sale.payments && sale.payments.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                                        <DollarSign className="h-4 w-4" />
                                        Pagos
                                    </h4>
                                    <div className="space-y-2">
                                        {sale.payments.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded-lg"
                                            >
                                                <span className="text-sm">
                                                    {payment.paymentMethod}
                                                </span>
                                                <span className="font-semibold text-green-600">
                                                    ${Number(payment.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Indicador de cuenta corriente y opción de marcar como pagada */}
                        {sale.isOnAccount && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-3">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                                    Esta venta está registrada en cuenta corriente
                                </p>

                                {/* Botón para marcar como pagada */}
                                {canMarkAsPaid && !showPaymentForm && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                        onClick={() => setShowPaymentForm(true)}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Marcar como Pagada
                                    </Button>
                                )}

                                {/* Formulario de pago */}
                                {showPaymentForm && (
                                    <div className="space-y-3 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                                        <p className="text-sm font-medium">Seleccione método de pago:</p>
                                        <Select
                                            value={selectedPaymentMethod}
                                            onValueChange={setSelectedPaymentMethod}
                                        >
                                            <SelectTrigger className="bg-white dark:bg-gray-900">
                                                <SelectValue placeholder="Seleccione método de pago" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethods?.map((method) => (
                                                    <SelectItem key={method.id} value={method.id}>
                                                        {method.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setShowPaymentForm(false);
                                                    setSelectedPaymentMethod('');
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                onClick={handleMarkAsPaid}
                                                disabled={!selectedPaymentMethod || markAsPaidMutation.isPending}
                                            >
                                                {markAsPaidMutation.isPending ? 'Procesando...' : 'Confirmar Pago'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notas */}
                        {sale.notes && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-1">Notas:</p>
                                <p className="text-sm text-muted-foreground">{sale.notes}</p>
                            </div>
                        )}

                        {/* Botón cerrar */}
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cerrar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Venta no encontrada</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
