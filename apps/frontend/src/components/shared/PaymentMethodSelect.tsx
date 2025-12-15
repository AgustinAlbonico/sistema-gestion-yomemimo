/**
 * Componente compartido para selección de método de pago
 * Reduce duplicación de código en formularios de gastos, ingresos y ventas
 */
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaymentMethods } from '@/features/configuration/hooks/use-payment-methods';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';

interface PaymentMethodSelectProps {
    readonly value: string | undefined;
    readonly onChange: (value: string) => void;
    readonly label?: string;
    readonly required?: boolean;
    readonly disabled?: boolean;
    readonly placeholder?: string;
    readonly variant?: 'select' | 'grid';
}

/**
 * Componente de selección de método de pago
 * Soporta dos variantes: select (dropdown) y grid (botones)
 */
export function PaymentMethodSelect({
    value,
    onChange,
    label = 'Método de Pago',
    required = false,
    disabled = false,
    placeholder = 'Seleccione método de pago',
    variant = 'select',
}: PaymentMethodSelectProps) {
    const { data: paymentMethods = [], isLoading } = usePaymentMethods();

    if (variant === 'grid') {
        return (
            <FormItem>
                <FormLabel>
                    {label} {required && <span className="text-red-500">*</span>}
                </FormLabel>
                <div className="grid grid-cols-6 gap-2">
                    {paymentMethods.map((pm) => {
                        const isSelected = value === pm.id;
                        return (
                            <button
                                key={pm.id}
                                type="button"
                                onClick={() => onChange(pm.id)}
                                disabled={disabled}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                                    isSelected
                                        ? 'border-primary bg-primary/10'
                                        : 'border-muted hover:border-muted-foreground/50'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {getPaymentMethodIcon(
                                    pm.code,
                                    `h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`
                                )}
                                <span
                                    className={`text-[10px] font-medium ${
                                        isSelected ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    {pm.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <FormMessage />
            </FormItem>
        );
    }

    return (
        <FormItem>
            <FormLabel>
                {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <Select onValueChange={onChange} value={value ?? ''} disabled={isLoading || disabled}>
                <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {!paymentMethods || paymentMethods.length === 0 ? (
                        <SelectItem value="none" disabled>
                            No hay métodos disponibles
                        </SelectItem>
                    ) : (
                        paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                                <div className="flex items-center gap-2">
                                    {getPaymentMethodIcon(method.code, 'h-4 w-4')}
                                    {method.name}
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
    );
}

