/**
 * Diálogo para registrar un pago de cuenta corriente
 * Muestra transacciones pendientes (ventas e ingresos) para marcarlas como pagadas
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ShoppingCart, FileText, CheckCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreatePayment, usePendingTransactions, customerAccountsKeys } from '../hooks/use-customer-accounts';
import { usePaymentMethods } from '@/features/configuration/hooks/use-payment-methods';
import { useOpenCashRegister } from '@/features/cash-register/hooks';
import type { CreatePaymentDto, PendingSale, PendingIncome } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly customerId: string;
    readonly currentDebt: number;
}

export function PaymentDialog({
    open,
    onOpenChange,
    customerId,
    currentDebt,
}: PaymentDialogProps) {
    const queryClient = useQueryClient();
    const { data: paymentMethods } = usePaymentMethods();
    const { data: pendingTransactions } = usePendingTransactions(customerId);
    const { data: openCashRegister } = useOpenCashRegister();
    const createPayment = useCreatePayment();

    // Verificar si la caja esta abierta
    const isCashRegisterOpen = !!openCashRegister;

    // Estados para transacciones seleccionadas
    const [selectedSales, setSelectedSales] = useState<string[]>([]);
    const [selectedIncomes, setSelectedIncomes] = useState<string[]>([]);
    const [isMarkingTransactions, setIsMarkingTransactions] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<CreatePaymentDto>();

    const selectedPaymentMethodId = watch('paymentMethodId');

    // Limpiar selecciones cuando se abre/cierra el diálogo
    useEffect(() => {
        if (!open) {
            setSelectedSales([]);
            setSelectedIncomes([]);
        }
    }, [open]);

    // Calcular total seleccionado
    const selectedSalesTotal = pendingTransactions?.sales
        ?.filter(s => selectedSales.includes(s.id))
        .reduce((sum, s) => sum + s.total, 0) || 0;

    const selectedIncomesTotal = pendingTransactions?.incomes
        ?.filter(i => selectedIncomes.includes(i.id))
        .reduce((sum, i) => sum + i.amount, 0) || 0;

    const totalSelected = selectedSalesTotal + selectedIncomesTotal;

    // Handler para marcar ventas como pagadas
    const markSaleAsPaid = async (saleId: string, paymentMethodId: string, amount: number) => {
        const response = await api.patch(`/api/sales/${saleId}/pay`, {
            payments: [{ paymentMethodId, amount }]
        });
        return response.data;
    };

    // Handler para marcar ingresos como pagados
    const markIncomeAsPaid = async (incomeId: string, paymentMethodId: string) => {
        const response = await api.patch(`/api/incomes/${incomeId}/mark-paid`, {
            paymentMethodId
        });
        return response.data;
    };

    const onSubmit = async (data: CreatePaymentDto) => {
        // Validar que la caja este abierta antes de procesar
        if (!isCashRegisterOpen) {
            toast.error('No puedes registrar pagos sin tener la caja abierta. Por favor, abre la caja primero.');
            return;
        }

        try {
            setIsMarkingTransactions(true);

            // 1. Registrar el pago en cuenta corriente
            await createPayment.mutateAsync({ customerId, data });

            // 2. Marcar transacciones seleccionadas como pagadas
            let transactionsMarked = 0;

            // Marcar ventas seleccionadas
            for (const saleId of selectedSales) {
                const sale = pendingTransactions?.sales.find(s => s.id === saleId);
                if (sale) {
                    try {
                        await markSaleAsPaid(saleId, data.paymentMethodId, sale.total);
                        transactionsMarked++;
                    } catch (error: any) {
                        toast.error(`Error al marcar venta ${sale.saleNumber}: ${error.response?.data?.message || error.message}`);
                    }
                }
            }

            // Marcar ingresos seleccionados
            for (const incomeId of selectedIncomes) {
                const income = pendingTransactions?.incomes.find(i => i.id === incomeId);
                if (income) {
                    try {
                        await markIncomeAsPaid(incomeId, data.paymentMethodId);
                        transactionsMarked++;
                    } catch (error: any) {
                        toast.error(`Error al marcar ingreso: ${error.response?.data?.message || error.message}`);
                    }
                }
            }

            if (transactionsMarked > 0) {
                toast.success(`${transactionsMarked} transacción(es) marcada(s) como pagada(s)`);
            }

            // Invalidar queries para refrescar datos
            queryClient.invalidateQueries({ queryKey: customerAccountsKeys.pendingTransactions(customerId) });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            queryClient.invalidateQueries({ queryKey: ['cash-register'] });

            reset();
            setSelectedSales([]);
            setSelectedIncomes([]);
            onOpenChange(false);
        } catch (error) {
            // Error ya manejado por el hook de createPayment
        } finally {
            setIsMarkingTransactions(false);
        }
    };

    const handlePayAll = () => {
        setValue('amount', currentDebt);
    };

    const toggleSaleSelection = (saleId: string) => {
        setSelectedSales(prev =>
            prev.includes(saleId)
                ? prev.filter(id => id !== saleId)
                : [...prev, saleId]
        );
    };

    const toggleIncomeSelection = (incomeId: string) => {
        setSelectedIncomes(prev =>
            prev.includes(incomeId)
                ? prev.filter(id => id !== incomeId)
                : [...prev, incomeId]
        );
    };

    const selectAllTransactions = () => {
        setSelectedSales(pendingTransactions?.sales.map(s => s.id) || []);
        setSelectedIncomes(pendingTransactions?.incomes.map(i => i.id) || []);
    };

    const clearAllSelections = () => {
        setSelectedSales([]);
        setSelectedIncomes([]);
    };

    const hasPendingTransactions = (pendingTransactions?.sales?.length || 0) > 0 ||
        (pendingTransactions?.incomes?.length || 0) > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                        Deuda actual: <span className="font-bold text-red-600">${currentDebt.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Seccion de transacciones pendientes */}
                    {hasPendingTransactions && (
                        <>
                            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            Transacciones Pendientes
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={selectAllTransactions}
                                            >
                                                Seleccionar todas
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearAllSelections}
                                            >
                                                Limpiar
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Selecciona las transacciones que deseas marcar como pagadas al registrar este pago.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Ventas pendientes */}
                                    {pendingTransactions?.sales && pendingTransactions.sales.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4" />
                                                Ventas ({pendingTransactions.sales.length})
                                            </Label>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {pendingTransactions.sales.map((sale: PendingSale) => {
                                                    const isSelected = selectedSales.includes(sale.id);
                                                    return (
                                                        <div
                                                            key={sale.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${isSelected
                                                                ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800'
                                                                : 'bg-background hover:bg-muted/50'
                                                                }`}
                                                            onClick={() => toggleSaleSelection(sale.id)}
                                                            onKeyDown={(e) => e.key === 'Enter' && toggleSaleSelection(sale.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`h-4 w-4 rounded-sm border shadow flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-primary'}`}
                                                                >
                                                                    {isSelected && <CheckCircle className="h-3 w-3" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{sale.saleNumber}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: es })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary" className="font-mono">
                                                                ${sale.total.toFixed(2)}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ingresos pendientes */}
                                    {pendingTransactions?.incomes && pendingTransactions.incomes.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Ingresos ({pendingTransactions.incomes.length})
                                            </Label>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {pendingTransactions.incomes.map((income: PendingIncome) => {
                                                    const isSelected = selectedIncomes.includes(income.id);
                                                    return (
                                                        <div
                                                            key={income.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${isSelected
                                                                ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800'
                                                                : 'bg-background hover:bg-muted/50'
                                                                }`}
                                                            onClick={() => toggleIncomeSelection(income.id)}
                                                            onKeyDown={(e) => e.key === 'Enter' && toggleIncomeSelection(income.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`h-4 w-4 rounded-sm border shadow flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-primary'}`}
                                                                >
                                                                    {isSelected && <CheckCircle className="h-3 w-3" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{income.description}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {format(new Date(income.incomeDate), "dd/MM/yyyy", { locale: es })}
                                                                        {income.category && ` • ${income.category.name}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary" className="font-mono">
                                                                ${income.amount.toFixed(2)}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Total seleccionado */}
                                    {totalSelected > 0 && (
                                        <div className="flex items-center justify-between p-2 rounded bg-green-100 dark:bg-green-950/50 border border-green-300 dark:border-green-800">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                Transacciones seleccionadas
                                            </span>
                                            <span className="font-bold text-green-700 dark:text-green-400">
                                                ${totalSelected.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Separator />
                        </>
                    )}

                    {/* Formulario de pago */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">
                            Monto a pagar <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <NumericInput
                                id="amount"
                                placeholder="0.00"
                                {...register('amount', {
                                    required: 'El monto es requerido',
                                    min: {
                                        value: 0.01,
                                        message: 'El monto debe ser mayor a 0',
                                    },
                                    max: {
                                        value: currentDebt,
                                        message: 'El monto no puede exceder la deuda',
                                    },
                                    valueAsNumber: true,
                                })}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePayAll}
                            >
                                Pagar todo
                            </Button>
                        </div>
                        {errors.amount && (
                            <p className="text-sm text-red-500">{errors.amount.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentMethodId">
                            Método de Pago <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedPaymentMethodId || ''}
                            onValueChange={(value) =>
                                setValue('paymentMethodId', value, {
                                    shouldValidate: true,
                                    shouldDirty: true
                                })
                            }
                        >
                            <SelectTrigger>
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
                        <input
                            type="hidden"
                            {...register('paymentMethodId', {
                                required: 'El método de pago es requerido',
                            })}
                        />
                        {errors.paymentMethodId && (
                            <p className="text-sm text-red-500">
                                {errors.paymentMethodId.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Input
                            id="description"
                            placeholder="Ej: Pago cuota 1 de 3"
                            {...register('description')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Observaciones adicionales"
                            rows={3}
                            {...register('notes')}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={createPayment.isPending || isMarkingTransactions}
                        >
                            {createPayment.isPending || isMarkingTransactions
                                ? 'Procesando...'
                                : selectedSales.length + selectedIncomes.length > 0
                                    ? `Registrar Pago y Marcar ${selectedSales.length + selectedIncomes.length} Transacción(es)`
                                    : 'Registrar Pago'
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
