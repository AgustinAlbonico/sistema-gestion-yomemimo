import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
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
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { openCashRegisterSchema, type OpenCashRegisterFormData } from '../schemas';
import { useOpenCashRegisterMutation, useSuggestedInitialAmount } from '../hooks';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OpenCashDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OpenCashDialog({ open, onOpenChange }: OpenCashDialogProps) {
    const mutation = useOpenCashRegisterMutation();
    const { data: suggestion, isLoading: isLoadingSuggestion } = useSuggestedInitialAmount();
    const [manuallyAdjusted, setManuallyAdjusted] = useState(false);
    const [showAdjustmentWarning, setShowAdjustmentWarning] = useState(false);

    const form = useForm<OpenCashRegisterFormData>({
        resolver: zodResolver(openCashRegisterSchema),
        defaultValues: {
            initialAmount: 0,
            manuallyAdjusted: false,
            adjustmentReason: '',
            openingNotes: '',
        },
    });

    // Actualizar el monto inicial cuando se cargue la sugerencia
    useEffect(() => {
        if (suggestion && open) {
            form.setValue('initialAmount', suggestion.suggested);
            setManuallyAdjusted(false);
            setShowAdjustmentWarning(false);
        }
    }, [suggestion, open, form]);

    // Detectar cambio manual del monto
    const handleAmountChange = (value: number) => {
        if (suggestion && value !== suggestion.suggested) {
            setManuallyAdjusted(true);
            setShowAdjustmentWarning(true);
        } else {
            setManuallyAdjusted(false);
            setShowAdjustmentWarning(false);
        }
        form.setValue('initialAmount', value);
    };

    const onSubmit = async (data: OpenCashRegisterFormData) => {
        await mutation.mutateAsync({
            initialAmount: data.initialAmount,
            manuallyAdjusted,
            adjustmentReason: data.adjustmentReason,
            openingNotes: data.openingNotes,
        });
        form.reset();
        setManuallyAdjusted(false);
        setShowAdjustmentWarning(false);
        onOpenChange(false);
    };

    const handleClose = () => {
        form.reset();
        setManuallyAdjusted(false);
        setShowAdjustmentWarning(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Abrir Caja</DialogTitle>
                    <DialogDescription>
                        Registra el monto inicial de efectivo en caja
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Información del día anterior */}
                        {suggestion?.previousDate && (
                            <Card className="bg-muted/50">
                                <CardContent className="pt-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Saldo final del {formatDate(suggestion.previousDate)}:
                                            </span>
                                            <span className="font-semibold">
                                                {formatCurrency(suggestion.previousActual)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Este es el monto sugerido para comenzar hoy
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Campo de monto inicial */}
                        <FormField
                            control={form.control}
                            name="initialAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto Inicial en Efectivo *</FormLabel>
                                    <FormControl>
                                        <NumericInput
                                            placeholder="0.00"
                                            value={field.value}
                                            onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                                            className={showAdjustmentWarning ? 'border-yellow-500 focus-visible:ring-yellow-500' : ''}
                                            autoFocus
                                        />
                                    </FormControl>
                                    {suggestion && suggestion.suggested > 0 && (
                                        <FormDescription>
                                            Sugerido: {formatCurrency(suggestion.suggested)}
                                        </FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Advertencia de ajuste manual */}
                        {showAdjustmentWarning && (
                            <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                                    Monto Ajustado Manualmente
                                </AlertTitle>
                                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                                    El monto ingresado difiere del saldo final de ayer.
                                    Por favor indica el motivo del ajuste.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Razón del ajuste (solo si se modificó) */}
                        {manuallyAdjusted && (
                            <FormField
                                control={form.control}
                                name="adjustmentReason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razón del Ajuste *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej: Depósito bancario de $5,000"
                                                className="resize-none"
                                                rows={2}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Explica por qué el monto difiere del día anterior
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Notas de apertura */}
                        <FormField
                            control={form.control}
                            name="openingNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observaciones al abrir la caja..."
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
                            <Button
                                type="submit"
                                disabled={mutation.isPending || (manuallyAdjusted && !form.watch('adjustmentReason'))}
                            >
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Abrir Caja
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
