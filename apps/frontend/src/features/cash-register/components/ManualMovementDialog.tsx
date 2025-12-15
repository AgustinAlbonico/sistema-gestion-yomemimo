/**
 * Diálogo para registrar movimientos manuales de caja
 * Permite ingresos (préstamos, reposición de cambio) y egresos (retiros para depósito)
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { createCashMovementSchema, type CreateCashMovementFormData } from '../schemas';
import { useCreateCashMovementMutation } from '../hooks';
import { usePaymentMethods } from '@/features/configuration/hooks/use-payment-methods';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';
import { cn } from '@/lib/utils';

interface ManualMovementDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
}

export function ManualMovementDialog({ open, onOpenChange }: ManualMovementDialogProps) {
    const mutation = useCreateCashMovementMutation();
    const { data: paymentMethods = [], isLoading: loadingMethods } = usePaymentMethods();

    const form = useForm<CreateCashMovementFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createCashMovementSchema as any),
        defaultValues: {
            movementType: 'income',
            paymentMethodId: '',
            amount: 0,
            description: '',
            notes: '',
        },
    });

    const movementType = form.watch('movementType');

    const onSubmit = async (data: CreateCashMovementFormData) => {
        await mutation.mutateAsync(data);
        form.reset();
        onOpenChange(false);
    };

    const handleClose = () => {
        form.reset();
        onOpenChange(false);
    };

    // Solo mostrar métodos de pago activos
    const activePaymentMethods = paymentMethods.filter((pm) => pm.isActive);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Movimiento Manual de Caja</DialogTitle>
                    <DialogDescription>
                        Registre un ingreso o egreso manual de dinero.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Tipo de movimiento */}
                        <FormField
                            control={form.control}
                            name="movementType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Movimiento</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <label
                                                className={cn(
                                                    'flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                                                    field.value === 'income'
                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                                        : 'border-muted hover:border-muted-foreground/50'
                                                )}
                                            >
                                                <RadioGroupItem value="income" className="sr-only" />
                                                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                                                <span className="font-medium">Ingreso</span>
                                            </label>
                                            <label
                                                className={cn(
                                                    'flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                                                    field.value === 'expense'
                                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                                                        : 'border-muted hover:border-muted-foreground/50'
                                                )}
                                            >
                                                <RadioGroupItem value="expense" className="sr-only" />
                                                <ArrowUpRight className="h-5 w-5 text-rose-600" />
                                                <span className="font-medium">Egreso</span>
                                            </label>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Método de pago */}
                        <FormField
                            control={form.control}
                            name="paymentMethodId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Método de Pago *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingMethods ? "Cargando..." : "Seleccione método de pago"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {activePaymentMethods.map((method) => (
                                                <SelectItem key={method.id} value={method.id}>
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(method.code, 'h-4 w-4')}
                                                        {method.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Monto */}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto *</FormLabel>
                                    <FormControl>
                                        <NumericInput
                                            placeholder="0.00"
                                            value={field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number.parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Descripción */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={
                                                movementType === 'income'
                                                    ? "Ej: Ingreso de cambio, Préstamo de gerencia"
                                                    : "Ej: Retiro para depósito bancario"
                                            }
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notas (opcional) */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observaciones adicionales..."
                                            className="resize-none"
                                            rows={2}
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
                                disabled={mutation.isPending}
                                className={cn(
                                    movementType === 'income'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                )}
                            >
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {movementType === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
