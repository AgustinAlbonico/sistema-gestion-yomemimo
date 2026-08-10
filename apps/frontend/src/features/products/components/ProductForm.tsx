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
import { NumericInput } from '@/components/ui/numeric-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { categoriesApi, productsApi } from '../api/products.api';
import { api } from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import { Percent, Info, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { BrandCombobox } from './BrandCombobox';

interface ProductFormProps {
    readonly initialData?: ProductFormValues;
    readonly onSubmit: (data: ProductFormValues) => void;
    readonly isLoading?: boolean;
    readonly isEditing?: boolean;
    readonly currentProductId?: string;
}

/**
 * Formulario de producto con dos modos:
 *
 * 1. Modo Precio Fijo (default ON): el usuario carga el precio de venta directamente.
 *    El costo es opcional. No se aplica jerarquía de márgenes.
 *
 * 2. Modo Calculado (default OFF): el usuario carga el costo y el sistema calcula
 *    el precio desde el margen efectivo (personalizado > categoría > general).
 */
export function ProductForm({ initialData, onSubmit, isLoading, isEditing, currentProductId }: ProductFormProps) {
    const [defaultMargin, setDefaultMargin] = useState<number>(30);

    useEffect(() => {
        api.get('/api/configuration')
            .then(res => {
                const margin = Number(res.data.defaultProfitMargin);
                setDefaultMargin(margin);
            })
            .catch(() => setDefaultMargin(30));
    }, []);

    // Detectar modo inicial: si initialData es de un producto existente que NO usa manual price
    // (productos cargados antes de esta feature), defaulteamos a manual=true (nuevo comportamiento).
    // El backend ya respetará el modo del initialData al editar.
    const initialUseManualPrice = initialData?.useManualPrice ?? true;

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: initialData
            ? { ...initialData, useManualPrice: initialUseManualPrice }
            : {
                name: '',
                description: null,
                barcode: null,
                cost: null,
                price: undefined,
                stock: 0,
                categoryId: null,
                isActive: true,
                useManualPrice: true,
                useCustomMargin: false,
                customProfitMargin: undefined,
                brandName: null,
            },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories', 'active'],
        queryFn: () => categoriesApi.getActive(),
    });

    const useManualPrice = form.watch('useManualPrice');
    const cost = form.watch('cost');
    const categoryId = form.watch('categoryId');
    const useCustomMargin = form.watch('useCustomMargin');
    const customProfitMargin = form.watch('customProfitMargin');

    const selectedCategory = useMemo(() => {
        if (!categoryId || !categories) return null;
        return categories.find(c => c.id === categoryId) || null;
    }, [categoryId, categories]);

    const marginInfo = useMemo(() => {
        if (useCustomMargin && customProfitMargin !== undefined) {
            return {
                margin: customProfitMargin,
                source: 'personalizado' as const,
                description: 'Margen personalizado del producto'
            };
        }
        if (selectedCategory?.profitMargin !== null && selectedCategory?.profitMargin !== undefined) {
            return {
                margin: selectedCategory.profitMargin,
                source: 'categoria' as const,
                description: `Margen de la categoría "${selectedCategory.name}"`
            };
        }
        return {
            margin: defaultMargin,
            source: 'general' as const,
            description: 'Margen general del sistema'
        };
    }, [useCustomMargin, customProfitMargin, selectedCategory, defaultMargin]);

    const calculatedPrice = useMemo(() => {
        const numericCost = typeof cost === 'number' && !Number.isNaN(cost) ? cost : 0;
        return numericCost > 0 ? numericCost * (1 + marginInfo.margin / 100) : 0;
    }, [cost, marginInfo.margin]);

    const handleBarcodeBlur = async (barcode: string | null | undefined) => {
        const trimmed = (barcode ?? '').trim();
        if (!trimmed) return;

        try {
            const existing = await productsApi.findByBarcode(trimmed);
            if (existing && existing.id !== currentProductId) {
                toast.warning(`Ya existe el producto "${existing.name}" con ese código`, {
                    description: 'Considerá editar el producto existente en vez de crear uno nuevo.',
                });
            }
        } catch {
            // Silenciar errores de red para no molestar al tipear
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Nombre del producto */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Producto <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: Shampoo Sedal 400ml"
                                    {...field}
                                    autoFocus
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Descripción del producto */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: Shampoo reparador para cabello dañado"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormDescription>Información adicional sobre el producto (opcional)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Código de barras */}
                <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Código de Barras</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: 7791234567890"
                                    {...field}
                                    value={field.value || ''}
                                    onBlur={() => handleBarcodeBlur(field.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormDescription>Código de barras del producto (opcional)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Marca (Autocomplete / Nueva) */}
                <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                            <FormLabel>Marca</FormLabel>
                            <FormControl>
                                <BrandCombobox
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Buscar o crear marca..."
                                />
                            </FormControl>
                            <FormDescription>
                                Selecciona una existente o escribe para crear una nueva
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Categoría (única) */}
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                                value={field.value || 'none'}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">
                                        <span className="text-muted-foreground">Sin categoría</span>
                                    </SelectItem>
                                    {categories?.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            <span className="flex items-center gap-2">
                                                {category.color && (
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                )}
                                                {category.name}
                                                {category.profitMargin !== null && category.profitMargin !== undefined && (
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        ({category.profitMargin}%)
                                                    </span>
                                                )}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {selectedCategory?.profitMargin !== null && selectedCategory?.profitMargin !== undefined && !useManualPrice ? (
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                        <Info className="h-3 w-3" />
                                        Esta categoría tiene {selectedCategory.profitMargin}% de ganancia configurado
                                    </span>
                                ) : (
                                    'Categoría del producto (opcional)'
                                )}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Toggle de modo Precio Fijo */}
                <FormField
                    control={form.control}
                    name="useManualPrice"
                    render={({ field }) => (
                        <FormItem className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                    <FormLabel className="text-base flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Precio Fijo
                                    </FormLabel>
                                    <FormDescription className="text-sm">
                                        Cuando está activado, cargás el precio de venta directamente.
                                        Cuando está desactivado, el sistema calcula el precio desde el costo y el margen de ganancia.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (!checked) {
                                                // Cambió a modo clásico: limpiar el price (se recalcula desde cost+margen)
                                                form.setValue('price', undefined);
                                                form.trigger('cost');
                                            } else {
                                                // Cambió a modo precio fijo: limpiar customProfitMargin (no aplica)
                                                form.setValue('useCustomMargin', false);
                                                form.setValue('customProfitMargin', undefined);
                                                form.setValue('profitMargin' as any, undefined);
                                                form.trigger('price');
                                            }
                                        }}
                                    />
                                </FormControl>
                            </div>
                        </FormItem>
                    )}
                />

                {/* Campo dinámico: Precio Final (modo manual) o Costo (modo clásico) */}
                {useManualPrice ? (
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Precio Final <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <NumericInput
                                        placeholder="0.00"
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number.parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Precio de venta cargado directamente. No se calcula desde costo.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Costo <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <NumericInput
                                        placeholder="0.00"
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number.parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormDescription>Precio de compra (se calcula el precio de venta con el margen)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Stock */}
                <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{isEditing ? 'Stock Actual' : 'Stock Inicial'} <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <NumericInput
                                    allowDecimals={false}
                                    placeholder="0"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number.parseInt(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormDescription>Cantidad disponible</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Preview del precio calculado + toggle margen personalizado: SOLO en modo clásico */}
                {!useManualPrice && (
                    <>
                        <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-green-700 dark:text-green-300">Precio de Venta</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Costo + {marginInfo.margin}%
                                        <span className="ml-1">
                                            ({marginInfo.source === 'personalizado'
                                                ? 'margen personalizado'
                                                : marginInfo.source === 'categoria'
                                                    ? `categoría: ${selectedCategory?.name}`
                                                    : 'margen general'})
                                        </span>
                                    </p>
                                </div>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(calculatedPrice)}
                                </span>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="useCustomMargin"
                            render={({ field }) => (
                                <FormItem className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2">
                                                <Percent className="h-4 w-4" />
                                                Margen de Ganancia Personalizado
                                            </FormLabel>
                                            <FormDescription>
                                                {field.value
                                                    ? 'Este producto usa un margen diferente'
                                                    : marginInfo.source === 'categoria'
                                                        ? `Usando margen de categoría (${marginInfo.margin}%)`
                                                        : `Usando margen general del sistema (${defaultMargin}%)`
                                                }
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    if (!checked) {
                                                        form.setValue('customProfitMargin', undefined);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </div>

                                    {field.value ? (
                                        <div className="mt-4 pt-4 border-t">
                                            <FormField
                                                control={form.control}
                                                name="customProfitMargin"
                                                render={({ field: marginField }) => (
                                                    <FormItem>
                                                        <FormLabel>Margen de Ganancia (%)</FormLabel>
                                                        <div className="flex items-center gap-2">
                                                            <FormControl>
                                                                <NumericInput
                                                                    placeholder="Ej: 50"
                                                                    className="max-w-[150px]"
                                                                    value={marginField.value ?? ''}
                                                                    onChange={(e) => marginField.onChange(e.target.value === '' ? undefined : Number.parseFloat(e.target.value) || 0)}
                                                                />
                                                            </FormControl>
                                                            <span className="text-muted-foreground">%</span>
                                                        </div>
                                                        <FormDescription>
                                                            {marginInfo.source === 'categoria'
                                                                ? `Sobrescribe el margen de la categoría (${selectedCategory?.profitMargin}%)`
                                                                : `Sobrescribe el margen general (${defaultMargin}%)`
                                                            }
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ) : null}
                                </FormItem>
                            )}
                        />
                    </>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Guardando...' : 'Guardar Producto'}
                </Button>
            </form>
        </Form>
    );
}
