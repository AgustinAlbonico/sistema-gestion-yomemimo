import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { NumericInput } from '@/components/ui/numeric-input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Banknote} from 'lucide-react';
import { closeCashRegisterSchema, type CloseCashRegisterFormData } from '../schemas';
import { useCloseCashRegisterMutation } from '../hooks';
import type { CashRegister, CashRegisterTotals } from '../types';
import { formatCurrency} from '@/lib/utils';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';

interface CloseCashDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly currentRegister: CashRegister | null;
}

export function CloseCashDialog({
    open,
    onOpenChange,
    currentRegister,
}: CloseCashDialogProps) {
    const mutation = useCloseCashRegisterMutation();
    const [actualAmounts, setActualAmounts] = useState<Record<string, number>>({});

    const expectedAmount = useMemo(() => {
        if (!currentRegister) return 0;
        return (
            Number(currentRegister.initialAmount) +
            Number(currentRegister.totalIncome) -
            Number(currentRegister.totalExpense)
        );
    }, [currentRegister]);

    // Obtener el total esperado de efectivo
    const cashTotal = useMemo(() => {
        return currentRegister?.totals?.find(t => t.paymentMethod?.code === 'cash');
    }, [currentRegister]);

    const form = useForm<CloseCashRegisterFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(closeCashRegisterSchema as any),
        defaultValues: {
            actualCashAmount: 0,
            actualAmounts: {},
            closingNotes: '',
        },
    });

    // Inicializar valores cuando se abre el dialog
    useEffect(() => {
        if (open && currentRegister?.totals) {
            const cashTotalValue = currentRegister.totals.find(t => t.paymentMethod?.code === 'cash');
            form.setValue('actualCashAmount', Number(cashTotalValue?.expectedAmount || 0));

            // Inicializar otros métodos con sus valores esperados
            const amounts: Record<string, number> = {};
            currentRegister.totals.forEach(t => {
                if (t.paymentMethod?.code && t.paymentMethod.code !== 'cash') {
                    amounts[t.paymentMethod.code] = Number(t.expectedAmount);
                }
            });
            setActualAmounts(amounts);
        }
    }, [open, currentRegister, form]);

    const actualCashAmount = form.watch('actualCashAmount');
    const cashDifference = useMemo(() => {
        const expected = Number(cashTotal?.expectedAmount || 0);
        return Number(actualCashAmount || 0) - expected;
    }, [actualCashAmount, cashTotal]);

    // Calcular diferencia total
    const totalDifference = useMemo(() => {
        if (!currentRegister?.totals) return 0;

        let diff = cashDifference;
        currentRegister.totals.forEach(t => {
            if (t.paymentMethod?.code && t.paymentMethod.code !== 'cash') {
                const actual = actualAmounts[t.paymentMethod.code] ?? Number(t.expectedAmount);
                diff += actual - Number(t.expectedAmount);
            }
        });
        return diff;
    }, [currentRegister, cashDifference, actualAmounts]);

    const onSubmit = async (data: CloseCashRegisterFormData) => {
        await mutation.mutateAsync({
            actualCashAmount: data.actualCashAmount,
            actualAmounts: actualAmounts,
            closingNotes: data.closingNotes,
        });
        form.reset();
        setActualAmounts({});
        onOpenChange(false);
    };

    const handleClose = () => {
        form.reset();
        setActualAmounts({});
        onOpenChange(false);
    };

    if (!currentRegister) return null;

    // Filtrar solo métodos con movimientos
    const activePaymentMethods = currentRegister.totals?.filter(
        t => t.paymentMethod?.code && t.paymentMethod.code !== 'cash' && (Number(t.totalIncome) > 0 || Number(t.totalExpense) > 0)
    ) || [];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cerrar Caja - Arqueo Detallado</DialogTitle>
                    <DialogDescription>
                        Realice el arqueo de caja e ingrese los montos reales contados.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Resumen General */}
                    <div className="grid grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Inicial</p>
                            <p className="font-semibold">{formatCurrency(currentRegister.initialAmount)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Ingresos</p>
                            <p className="font-semibold text-green-600">+{formatCurrency(currentRegister.totalIncome)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Egresos</p>
                            <p className="font-semibold text-red-600">-{formatCurrency(currentRegister.totalExpense)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Esperado</p>
                            <p className="font-bold text-lg">{formatCurrency(expectedAmount)}</p>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Arqueo de Efectivo */}
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Banknote className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold">Efectivo</span>
                                    </div>
                                    <Badge variant={cashDifference === 0 ? 'default' : cashDifference > 0 ? 'secondary' : 'destructive'}>
                                        {cashDifference >= 0 ? '+' : ''}{formatCurrency(cashDifference)}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Inicial</span>
                                        <p className="font-medium">{formatCurrency(cashTotal?.initialAmount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">+ Ingresos</span>
                                        <p className="font-medium text-green-600">{formatCurrency(cashTotal?.totalIncome || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">- Egresos</span>
                                        <p className="font-medium text-red-600">{formatCurrency(cashTotal?.totalExpense || 0)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Esperado</span>
                                        <p className="font-semibold">{formatCurrency(cashTotal?.expectedAmount || 0)}</p>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="actualCashAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Contado Real *</FormLabel>
                                                <FormControl>
                                                    <NumericInput
                                                        placeholder="0.00"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number.parseFloat(e.target.value) || 0)}
                                                        autoFocus
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Otros Métodos de Pago */}
                            {activePaymentMethods.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">Otros Métodos de Pago</h4>
                                    {activePaymentMethods.map((total) => (
                                        <PaymentMethodArqueo
                                            key={total.id}
                                            total={total}
                                            actualAmount={actualAmounts[total.paymentMethod?.code] ?? Number(total.expectedAmount)}
                                            onActualAmountChange={(amount) =>
                                                setActualAmounts(prev => ({
                                                    ...prev,
                                                    [total.paymentMethod?.code]: amount,
                                                }))
                                            }
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Diferencia Total */}
                            {totalDifference !== 0 && (
                                <Alert variant={totalDifference > 0 ? 'default' : 'destructive'}>
                                    {totalDifference > 0 ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4" />
                                    )}
                                    <AlertDescription>
                                        <span className="font-semibold">
                                            Diferencia Total: {totalDifference > 0 ? 'Sobrante' : 'Faltante'} de {formatCurrency(Math.abs(totalDifference))}
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <FormField
                                control={form.control}
                                name="closingNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notas de Cierre (opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Observaciones al cerrar la caja..."
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={mutation.isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Cerrar Caja
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Componente para arqueo de cada método de pago
interface PaymentMethodArqueoProps {
    readonly total: CashRegisterTotals;
    readonly actualAmount: number;
    readonly onActualAmountChange: (amount: number) => void;
}

function PaymentMethodArqueo({ total, actualAmount, onActualAmountChange }: PaymentMethodArqueoProps) {
    const icon = getPaymentMethodIcon(total.paymentMethod?.code);
    const difference = actualAmount - Number(total.expectedAmount);

    return (
        <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-medium text-sm">{total.paymentMethod.name}</span>
                </div>
                <Badge
                    variant={difference === 0 ? 'outline' : difference > 0 ? 'secondary' : 'destructive'}
                    className="text-xs"
                >
                    {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                    <span className="text-muted-foreground block">Ingresos</span>
                    <p className="font-medium text-green-600">{formatCurrency(total.totalIncome)}</p>
                </div>
                <div>
                    <span className="text-muted-foreground block">Esperado</span>
                    <p className="font-medium">{formatCurrency(total.expectedAmount)}</p>
                </div>
                <div>
                    <label htmlFor={`actual-${total.paymentMethod.id}`} className="text-muted-foreground block">Real</label>
                    <NumericInput
                        id={`actual-${total.paymentMethod.id}`}
                        value={actualAmount}
                        onChange={(e) => onActualAmountChange(Number.parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs"
                    />
                </div>
            </div>
        </div>
    );
}
