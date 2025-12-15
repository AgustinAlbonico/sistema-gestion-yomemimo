/**
 * Diálogo para aplicar recargo/interés a una cuenta corriente
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Percent, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { useApplySurcharge } from '../hooks/use-customer-accounts';
import type { ApplySurchargeDto, SurchargeType } from '../types';

interface ApplySurchargeDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly customerId: string;
    readonly currentBalance: number;
}

interface FormValues {
    surchargeType: SurchargeType;
    value: number;
    description: string;
}

export function ApplySurchargeDialog({
    open,
    onOpenChange,
    customerId,
    currentBalance,
}: ApplySurchargeDialogProps) {
    const applySurchargeMutation = useApplySurcharge();
    const [calculatedAmount, setCalculatedAmount] = useState(0);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            surchargeType: 'percentage',
            value: 0,
            description: '',
        },
    });

    const surchargeType = watch('surchargeType');
    const value = watch('value');

    // Calcular el monto del recargo en tiempo real
    useEffect(() => {
        const numValue = Number(value) || 0;
        if (surchargeType === 'percentage') {
            setCalculatedAmount(Math.round((currentBalance * (numValue / 100)) * 100) / 100);
        } else {
            setCalculatedAmount(numValue);
        }
    }, [surchargeType, value, currentBalance]);

    // Reset form cuando se abre el diálogo
    useEffect(() => {
        if (open) {
            reset({
                surchargeType: 'percentage',
                value: 0,
                description: '',
            });
            setCalculatedAmount(0);
        }
    }, [open, reset]);

    const onSubmit = (data: FormValues) => {
        if (calculatedAmount <= 0) return;

        const dto: ApplySurchargeDto = {
            surchargeType: data.surchargeType,
            value: Number(data.value),
            description: data.description || undefined,
        };

        applySurchargeMutation.mutate(
            { customerId, data: dto },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    const newBalance = currentBalance + calculatedAmount;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        Aplicar Recargo
                    </DialogTitle>
                    <DialogDescription>
                        Aplica un recargo por mora al saldo actual del cliente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Saldo actual */}
                    <Card className="bg-muted/50">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Saldo actual del cliente</span>
                                <span className="text-lg font-bold text-red-600">
                                    ${currentBalance.toFixed(2)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tipo de recargo */}
                    <div className="space-y-3">
                        <Label>Tipo de recargo</Label>
                        <RadioGroup
                            value={surchargeType}
                            onValueChange={(val) => setValue('surchargeType', val as SurchargeType)}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem
                                    value="percentage"
                                    id="percentage"
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="percentage"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <Percent className="mb-2 h-6 w-6 text-blue-500" />
                                    <span className="font-medium">Porcentual</span>
                                    <span className="text-xs text-muted-foreground">% del saldo</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem
                                    value="fixed"
                                    id="fixed"
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="fixed"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <DollarSign className="mb-2 h-6 w-6 text-green-500" />
                                    <span className="font-medium">Monto Fijo</span>
                                    <span className="text-xs text-muted-foreground">Valor exacto</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Valor */}
                    <div className="space-y-2">
                        <Label htmlFor="value">
                            {surchargeType === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {surchargeType === 'percentage' ? '%' : '$'}
                            </span>
                            <Input
                                id="value"
                                type="number"
                                step="any"
                                min="0.01"
                                className="pl-8"
                                placeholder={surchargeType === 'percentage' ? '3' : '100.00'}
                                {...register('value', {
                                    required: 'El valor es requerido',
                                    min: { value: 0.01, message: 'El valor debe ser mayor a 0' },
                                })}
                            />
                        </div>
                        {errors.value && (
                            <p className="text-sm text-red-500">{errors.value.message}</p>
                        )}
                    </div>

                    {/* Preview del recargo */}
                    {calculatedAmount > 0 && (
                        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Recargo a aplicar:</span>
                                    <span className="font-bold text-orange-600">
                                        +${calculatedAmount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t pt-2">
                                    <span className="text-sm font-medium">Nuevo saldo:</span>
                                    <span className="text-lg font-bold text-red-600">
                                        ${newBalance.toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Descripción opcional */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Descripción <span className="text-muted-foreground">(opcional)</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Ej: Recargo por mora - Diciembre 2024"
                            className="resize-none"
                            rows={2}
                            {...register('description')}
                        />
                    </div>

                    {/* Advertencia */}
                    <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            Esta acción agregará un cargo de interés a la cuenta del cliente y no puede deshacerse.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={applySurchargeMutation.isPending || calculatedAmount <= 0}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {applySurchargeMutation.isPending ? 'Aplicando...' : 'Aplicar Recargo'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
