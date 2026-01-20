
import {
    Banknote,
    Wallet,
    Plus,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumericInput } from '@/components/ui/numeric-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FormField,
} from '@/components/ui/form';
import { Control } from 'react-hook-form';
import { PaymentMethod } from '../types';
import { PaymentMethodIcons } from '../constants';
import { Badge } from '@/components/ui/badge';
import { CreateSaleFormValues } from '../schemas/sale.schema';

interface SalePaymentsProps {
    readonly paymentFields: readonly {
        id: string;
        name: string;
    }[];
    readonly appendPayment: (value: CreateSaleFormValues['payments'][number]) => void;
    readonly removePayment: (index: number) => void;
    readonly paymentMethods?: readonly PaymentMethod[];
    readonly total: number;
    readonly pendingAmount: number;
    readonly isOnAccount: boolean;
    readonly control: Control<CreateSaleFormValues>;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

export function SalePayments({
    paymentFields,
    appendPayment,
    removePayment,
    paymentMethods,
    total,
    pendingAmount,
    isOnAccount,
    control,
}: SalePaymentsProps) {

    if (isOnAccount) {
        return (
            <div className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Forma de Pago</h3>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
                    <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">
                        Cuenta Corriente
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                        La venta se registrará en la cuenta corriente del cliente.
                        El saldo pendiente es de <strong>{formatCurrency(total)}</strong>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Banknote className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Pagos</h3>
                        <p className={`text-xs ${Math.abs(pendingAmount) < 0.01 ? 'text-green-600 font-medium' : 'text-amber-600'}`}>
                            {Math.abs(pendingAmount) < 0.01
                                ? 'Total cubierto'
                                : `Faltan: ${formatCurrency(pendingAmount)}`
                            }
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendPayment({ paymentMethod: PaymentMethod.CASH, amount: Math.max(pendingAmount, 0) })}
                    disabled={pendingAmount <= 0.01}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Pago
                </Button>
            </div>

            <div className="space-y-3">
                {paymentFields.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                        No hay pagos registrados
                    </div>
                ) : (
                    paymentFields.map((field, index) => (
                        <div key={field.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/20 rounded-lg border">
                            <div className="flex-1 min-w-[140px]">
                                <FormField
                                    control={control}
                                    name={`payments.${index}.paymentMethod`}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethods?.map((method) => {
                                                    const Icon = PaymentMethodIcons[method.code as PaymentMethod] || Banknote;
                                                    return (
                                                        <SelectItem key={method.id} value={method.code}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="h-4 w-4" />
                                                                <span>{method.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="flex gap-2 flex-1">
                                <FormField
                                    control={control}
                                    name={`payments.${index}.amount`}
                                    render={({ field }) => (
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                            <NumericInput
                                                className="pl-7 bg-background"
                                                value={field.value}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                    const val = Number.parseFloat(e.target.value) || 0;
                                                    field.onChange(val);
                                                }}
                                            />
                                        </div>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => removePayment(index)}
                                    disabled={paymentFields.length === 1 && index === 0}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
