/**
 * Diálogo para registrar un pago de cuenta corriente
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreatePayment } from '../hooks/use-customer-accounts';
import { usePaymentMethods } from '@/features/configuration/hooks/use-payment-methods';
import type { CreatePaymentDto } from '../types';

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
    const { data: paymentMethods } = usePaymentMethods();
    const createPayment = useCreatePayment();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<CreatePaymentDto>();

    const selectedPaymentMethodId = watch('paymentMethodId');

    const onSubmit = async (data: CreatePaymentDto) => {
        try {
            await createPayment.mutateAsync({ customerId, data });
            reset();
            onOpenChange(false);
        } catch (error) {
            // Error ya manejado por el hook
        }
    };

    const handlePayAll = () => {
        setValue('amount', currentDebt);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                        Deuda actual: <span className="font-bold text-red-600">${currentDebt.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">
                            Monto <span className="text-red-500">*</span>
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
                            value={selectedPaymentMethodId}
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
                        <Button type="submit" disabled={createPayment.isPending}>
                            {createPayment.isPending ? 'Registrando...' : 'Registrar Pago'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
