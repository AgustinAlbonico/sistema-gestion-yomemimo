/**
 * Modal para marcar una compra como pagada
 * Permite seleccionar el método de pago
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Purchase } from '../types';
import { formatCurrency } from '@/lib/utils';
import { paymentMethodsApi, PaymentMethod } from '@/features/configuration/api/payment-methods.api';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';
import { Loader2, CreditCard, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkAsPaidDialogProps {
    readonly purchase: Purchase | null;
    readonly open: boolean;
    readonly onClose: () => void;
    readonly onConfirm: (purchaseId: string, paymentMethodId: string) => void;
    readonly isLoading?: boolean;
}

export function MarkAsPaidDialog({
    purchase,
    open,
    onClose,
    onConfirm,
    isLoading = false,
}: MarkAsPaidDialogProps) {
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');

    const { data: paymentMethods = [], isLoading: loadingMethods } = useQuery({
        queryKey: ['paymentMethods'],
        queryFn: paymentMethodsApi.getAll,
        enabled: open,
    });

    const activePaymentMethods = paymentMethods.filter((pm) => pm.isActive);

    const handleConfirm = () => {
        if (purchase && selectedPaymentMethodId) {
            onConfirm(purchase.id, selectedPaymentMethodId);
        }
    };

    const handleClose = () => {
        setSelectedPaymentMethodId('');
        onClose();
    };

    if (!purchase) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Marcar Compra como Pagada
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona el método de pago. Esto registrará el egreso en caja y actualizará el stock.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Info de la compra */}
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Compra</span>
                            <span className="font-mono font-medium">{purchase.purchaseNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Proveedor</span>
                            <span className="font-medium">{purchase.providerName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="font-bold text-lg text-red-600">
                                {formatCurrency(purchase.total)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Productos</span>
                            <span>{purchase.items.length} items</span>
                        </div>
                    </div>

                    {/* Selección de método de pago */}
                    <div className="space-y-3">
                        <Label>Método de pago *</Label>
                        {loadingMethods ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {activePaymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setSelectedPaymentMethodId(method.id)}
                                        className={cn(
                                            'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                                            'bg-white dark:bg-slate-900 shadow-sm',
                                            'hover:border-primary/50 hover:bg-primary/5 hover:shadow-md',
                                            selectedPaymentMethodId === method.id
                                                ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                                                : 'border-slate-200 dark:border-slate-700'
                                        )}
                                    >
                                        <div className={cn(
                                            'p-1.5 rounded-full',
                                            selectedPaymentMethodId === method.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                        )}>
                                            {getPaymentMethodIcon(method.code, 'h-4 w-4')}
                                        </div>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            selectedPaymentMethodId === method.id && 'text-primary'
                                        )}>
                                            {method.name}
                                        </span>
                                        {selectedPaymentMethodId === method.id && (
                                            <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedPaymentMethodId || isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirmar Pago
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
