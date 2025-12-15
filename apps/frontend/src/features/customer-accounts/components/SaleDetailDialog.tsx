/**
 * Diálogo de detalle de venta con diseño premium
 * Muestra información completa de una venta específica
 * Permite marcar ventas pendientes como pagadas
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    FileText,
    Package,
    DollarSign,
    Calendar,
    User,
    CheckCircle,
    ShoppingCart,
    CheckCircle2,
    Clock,
    XCircle,
    Landmark,
    CreditCard,
    TrendingDown,
    Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
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
    Sale,
    SaleStatus,
    SaleStatusLabels,
    CreateSalePaymentDTO,
} from '@/features/sales/types';
import { usePaymentMethods } from '@/features/configuration/hooks/use-payment-methods';

interface SaleDetailDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly saleId: string | null;
    readonly onSalePaid?: () => void;
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
 * Obtiene estilo del estado de la venta
 */
function getStatusStyle(status: SaleStatus) {
    switch (status) {
        case SaleStatus.COMPLETED:
            return {
                icon: CheckCircle2,
                className: 'bg-green-500/30 text-white border-green-400/50',
            };
        case SaleStatus.PENDING:
            return {
                icon: Clock,
                className: 'bg-yellow-500/30 text-white border-yellow-400/50',
            };
        case SaleStatus.CANCELLED:
            return {
                icon: XCircle,
                className: 'bg-red-500/30 text-white border-red-400/50',
            };
        default:
            return {
                icon: Clock,
                className: 'bg-slate-500/30 text-white border-slate-400/50',
            };
    }
}

function SaleLoadingState() {
    return (
        <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Cargando detalles...</p>
        </div>
    );
}

function SaleNotFoundState() {
    return (
        <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Venta no encontrada</p>
        </div>
    );
}

function SaleItemsSection({ sale }: { sale: Sale }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Productos ({sale.items.length})
                </span>
            </div>
            <div className="space-y-2">
                {sale.items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex justify-between items-start p-3 rounded-lg border border-border/50 ${index % 2 === 0 ? 'bg-muted/20' : 'bg-muted/40'
                            }`}
                    >
                        <div className="flex-1">
                            <p className="font-medium">
                                {item.productDescription}
                            </p>
                            {item.productCode ? (
                                <p className="text-xs text-muted-foreground">
                                    SKU: {item.productCode}
                                </p>
                            ) : null}
                            <p className="text-sm text-muted-foreground">
                                {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">
                                {formatCurrency(Number(item.subtotal))}
                            </p>
                            {item.discount > 0 ? (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                    -{formatCurrency(Number(item.discount))} desc.
                                </p>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SaleTotalsSection({ sale }: { sale: Sale }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Resumen de Pago
                </span>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 border border-border/50 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(Number(sale.subtotal))}</span>
                </div>
                {sale.discount > 0 ? (
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <TrendingDown className="h-3.5 w-3.5" />
                            <span>Descuento:</span>
                        </div>
                        <span className="font-medium text-green-600 dark:text-green-400">
                            -{formatCurrency(Number(sale.discount))}
                        </span>
                    </div>
                ) : null}
                {sale.tax > 0 ? (
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Percent className="h-3.5 w-3.5" />
                            <span>Impuestos:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(Number(sale.tax))}</span>
                    </div>
                ) : null}
            </div>

            {/* Total destacado */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 p-4 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                        TOTAL
                    </span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(sale.total))}
                    </span>
                </div>
            </div>
        </div>
    );
}

function SalePaymentsSection({ sale }: { sale: Sale }) {
    if (!sale.payments || sale.payments.length === 0) return null;

    return (
        <>
            <Separator />
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Pagos Realizados
                    </span>
                </div>
                <div className="space-y-2">
                    {sale.payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="font-medium">
                                    {payment.paymentMethod}
                                </span>
                            </div>
                            <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                                {formatCurrency(Number(payment.amount))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function SaleOnAccountSection({
    sale,
    canMarkAsPaid,
    showPaymentForm,
    onShowPaymentForm,
    selectedPaymentMethod,
    onSelectedPaymentMethod,
    paymentMethods,
    onConfirmPayment,
    isConfirming,
}: {
    sale: Sale;
    canMarkAsPaid: boolean;
    showPaymentForm: boolean;
    onShowPaymentForm: (show: boolean) => void;
    selectedPaymentMethod: string;
    onSelectedPaymentMethod: (id: string) => void;
    paymentMethods: Array<{ id: string; name: string }> | undefined;
    onConfirmPayment: () => void;
    isConfirming: boolean;
}) {
    if (!sale.isOnAccount) return null;

    return (
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 border border-amber-200 dark:border-amber-800/50 space-y-3">
            <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    Esta venta está registrada en cuenta corriente
                </p>
            </div>

            {canMarkAsPaid && !showPaymentForm ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => onShowPaymentForm(true)}
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Pagada
                </Button>
            ) : null}

            {showPaymentForm ? (
                <div className="space-y-3 pt-2 border-t border-amber-200 dark:border-amber-700">
                    <p className="text-sm font-medium">Seleccione método de pago:</p>
                    <Select
                        value={selectedPaymentMethod}
                        onValueChange={onSelectedPaymentMethod}
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
                                onShowPaymentForm(false);
                                onSelectedPaymentMethod('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={onConfirmPayment}
                            disabled={!selectedPaymentMethod || isConfirming}
                        >
                            {isConfirming ? 'Procesando...' : 'Confirmar Pago'}
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SaleNotesSection({ sale }: { sale: Sale }) {
    if (!sale.notes) return null;

    return (
        <>
            <Separator />
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Notas
                    </span>
                </div>
                <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {sale.notes}
                    </p>
                </div>
            </div>
        </>
    );
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
            const payments: CreateSalePaymentDTO[] = [
                {
                    paymentMethodId: params.paymentMethodId,
                    amount: Number(sale?.total ?? 0),
                },
            ];
            return salesApi.markAsPaid(params.saleId, payments);
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

    const canMarkAsPaid = Boolean(
        sale?.isOnAccount && (sale.status === SaleStatus.PENDING || sale.status === SaleStatus.PARTIAL),
    );

    const getCustomerName = (): string => {
        if (!sale) return '';
        if (sale.customer) {
            return `${sale.customer.firstName} ${sale.customer.lastName}`;
        }
        return sale.customerName || 'Consumidor Final';
    };

    const dialogBody = (() => {
        if (isLoading) return <SaleLoadingState />;
        if (!sale) return <SaleNotFoundState />;

        const statusStyle = getStatusStyle(sale.status as SaleStatus);
        const StatusIcon = statusStyle.icon;

        return (
            <>
                {/* Header con gradiente */}
                <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 py-5 text-primary-foreground -mx-6 -mt-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold tracking-tight">
                                Venta {sale.saleNumber}
                            </h2>
                            <p className="text-sm opacity-80 flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(sale.saleDate), "d 'de' MMMM 'de' yyyy", { locale: es })}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge
                                    variant="secondary"
                                    className={statusStyle.className}
                                >
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {SaleStatusLabels[sale.status as SaleStatus]}
                                </Badge>
                                {sale.isOnAccount ? (
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-500/30 text-white border-blue-400/50"
                                    >
                                        <Landmark className="h-3 w-3 mr-1" />
                                        Cuenta Corriente
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Cliente */}
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-500/10 rounded-lg">
                                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Cliente</p>
                                <p className="font-semibold">{getCustomerName()}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <SaleItemsSection sale={sale} />

                    <Separator />

                    <SaleTotalsSection sale={sale} />

                    <SalePaymentsSection sale={sale} />

                    <SaleOnAccountSection
                        sale={sale}
                        canMarkAsPaid={canMarkAsPaid}
                        showPaymentForm={showPaymentForm}
                        onShowPaymentForm={setShowPaymentForm}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onSelectedPaymentMethod={setSelectedPaymentMethod}
                        paymentMethods={paymentMethods}
                        onConfirmPayment={handleMarkAsPaid}
                        isConfirming={markAsPaidMutation.isPending}
                    />

                    <SaleNotesSection sale={sale} />

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            </>
        );
    })();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                {dialogBody}
            </DialogContent>
        </Dialog>
    );
}
