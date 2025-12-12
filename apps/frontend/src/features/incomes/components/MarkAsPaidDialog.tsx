/**
 * Dialog para marcar un ingreso como cobrado
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { paymentMethodsApi } from '@/features/configuration/api/payment-methods.api';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';
import { Loader2 } from 'lucide-react';

interface MarkAsPaidDialogProps {
    readonly open: boolean;
    readonly onClose: () => void;
    readonly onConfirm: (paymentMethodId: string) => void;
    readonly isLoading?: boolean;
}

export function MarkAsPaidDialog({
    open,
    onClose,
    onConfirm,
    isLoading,
}: MarkAsPaidDialogProps) {
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

    const { data: paymentMethods = [] } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: paymentMethodsApi.getAll,
        select: (data) => data.filter((pm) => pm.isActive),
    });

    const handleConfirm = () => {
        if (selectedMethodId) {
            onConfirm(selectedMethodId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Marcar como Cobrado</DialogTitle>
                    <DialogDescription>
                        Selecciona el método de pago con el que se cobró este ingreso
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2 py-4">
                    {paymentMethods.map((pm) => {
                        const isSelected = selectedMethodId === pm.id;
                        return (
                            <button
                                key={pm.id}
                                type="button"
                                onClick={() => setSelectedMethodId(pm.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-muted hover:border-muted-foreground/50'
                                    }`}
                            >
                                {getPaymentMethodIcon(pm.code, `h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`)}
                                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {pm.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedMethodId || isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
