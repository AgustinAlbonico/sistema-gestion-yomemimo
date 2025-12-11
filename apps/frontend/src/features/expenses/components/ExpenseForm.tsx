/**
 * Formulario para crear/editar gastos
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormValues } from '../schemas/expense.schema';

import { getTodayLocal } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseCategoriesApi } from '../api/expenses.api';
import { paymentMethodsApi } from '@/features/configuration/api/payment-methods.api';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseFormProps {
    initialData?: Partial<ExpenseFormValues>;
    onSubmit: (data: ExpenseFormValues) => void;
    isLoading?: boolean;
    isEditing?: boolean;
}

/**
 * Componente de formulario para crear o editar un gasto
 */
export function ExpenseForm({
    initialData,
    onSubmit,
    isLoading,
    isEditing,
}: ExpenseFormProps) {
    // Obtener categorías
    const { data: categories, isLoading: loadingCategories } = useQuery({
        queryKey: ['expense-categories'],
        queryFn: expenseCategoriesApi.getAll,
    });

    // Obtener métodos de pago
    const { data: paymentMethods, isLoading: loadingPaymentMethods } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: paymentMethodsApi.getAll,
    });

    const queryClient = useQueryClient();

    const seedPaymentMethodsMutation = useMutation({
        mutationFn: paymentMethodsApi.seed,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success(`${data.created} métodos de pago inicializados`);
        },
        onError: () => {
            toast.error('Error al inicializar métodos de pago');
        },
    });

    // Fecha de hoy en formato YYYY-MM-DD (usando zona horaria local)
    const today = getTodayLocal();

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: initialData?.description ?? '',
            amount: initialData?.amount ?? 0,
            expenseDate: initialData?.expenseDate ?? today,
            categoryId: initialData?.categoryId ?? undefined,
            paymentMethodId: initialData?.paymentMethodId,
            receiptNumber: initialData?.receiptNumber ?? '',
            isPaid: initialData?.isPaid ?? true,
            notes: initialData?.notes ?? '',
        },
    });

    const isPaid = form.watch('isPaid');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Descripción */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: Pago de alquiler mes de noviembre"
                                    {...field}
                                    autoFocus
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Categoría */}
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(value === '__none__' ? undefined : value)}
                                value={field.value ?? '__none__'}
                                disabled={loadingCategories}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin categoría (opcional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">Sin categoría</SelectItem>
                                    {categories?.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>Opcional - Organiza tus gastos por categorías</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Monto y Fecha */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <NumericInput
                                        placeholder="0.00"
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="expenseDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Método de pago */}
                <FormField
                    control={form.control}
                    name="paymentMethodId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Método de pago{' '}
                                {isPaid && <span className="text-red-500">*</span>}
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value ?? ''}
                                disabled={loadingPaymentMethods || !isPaid}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione método de pago" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {(!paymentMethods || paymentMethods.length === 0) && (
                                        <div className="p-2 flex justify-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs h-8"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    seedPaymentMethodsMutation.mutate();
                                                }}
                                                disabled={seedPaymentMethodsMutation.isPending}
                                            >
                                                {seedPaymentMethodsMutation.isPending ? (
                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="mr-2 h-3 w-3" />
                                                )}
                                                Inicializar métodos
                                            </Button>
                                        </div>
                                    )}
                                    {paymentMethods?.map((method) => (
                                        <SelectItem key={method.id} value={method.id}>
                                            <div className="flex items-center gap-2">
                                                {getPaymentMethodIcon(method.code)}
                                                <span>{method.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Nro. Comprobante */}
                <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nro. Comprobante</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: FAC-001234"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>Opcional</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Notas */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Notas adicionales..."
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Checkbox: Pagado */}
                <FormField
                    control={form.control}
                    name="isPaid"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Pagado</FormLabel>
                                <FormDescription>
                                    El gasto ya fue pagado
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                {/* Indicador de estado pendiente */}
                {!isPaid && (
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            ⚠️ Este gasto quedará como <strong>pendiente de pago</strong>
                        </p>
                    </div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Actualizar Gasto' : 'Registrar Gasto'}
                </Button>
            </form>
        </Form>
    );
}

