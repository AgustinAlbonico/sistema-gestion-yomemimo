import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormValues } from '../schemas/product.schema';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/products.api';
import { api } from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ProductFormProps {
    initialData?: ProductFormValues;
    onSubmit: (data: ProductFormValues) => void;
    isLoading?: boolean;
    isEditing?: boolean;
}

/**
 * Formulario simplificado de producto
 * - Nombre (requerido)
 * - Costo (requerido)
 * - Stock (requerido para carga inicial)
 * - Categoría (opcional)
 */
export function ProductForm({ initialData, onSubmit, isLoading, isEditing }: ProductFormProps) {
    const [defaultMargin, setDefaultMargin] = useState<number>(30);

    // Obtener el % de ganancia por defecto de la configuración
    useEffect(() => {
        api.get('/api/configuration')
            .then(res => {
                const margin = Number(res.data.defaultProfitMargin);
                setDefaultMargin(margin);
            })
            .catch(() => setDefaultMargin(30));
    }, []);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: initialData || {
            name: '',
            cost: 0,
            stock: 0,
            isActive: true,
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories', 'active'],
        queryFn: () => categoriesApi.getActive(),
    });

    // Watch cost para calcular precio
    const cost = form.watch('cost');
    const calculatedPrice = cost > 0 ? cost * (1 + defaultMargin / 100) : 0;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Nombre del producto */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Producto *</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Ej: Coca Cola 500ml" 
                                    {...field} 
                                    autoFocus
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Categoría (opcional) */}
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin categoría" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories?.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Costo y Stock en una fila */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Costo *</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        min="0"
                                        placeholder="0.00"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription>Precio de compra</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{isEditing ? 'Stock Actual' : 'Stock Inicial'} *</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="1" 
                                        min="0"
                                        placeholder="0"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription>Cantidad disponible</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Preview del precio calculado */}
                <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-green-700 dark:text-green-300">Precio de Venta</p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                                (Costo + {defaultMargin}% ganancia)
                            </p>
                        </div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(calculatedPrice)}
                        </span>
                    </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Guardando...' : 'Guardar Producto'}
                </Button>
            </form>
        </Form>
    );
}
