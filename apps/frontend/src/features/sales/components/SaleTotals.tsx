import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import {
    Percent,
    Plus,
    Trash2,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FormField,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { useTaxTypes, useCreateTaxType } from '@/features/configuration/api/tax-types.api';
import {
    useDiscountCalculation,
    useSurchargeCalculation,
    useTaxAmountCalculation,
    useTaxSync
} from '../hooks/useSaleFormEffects';

interface SaleTotalsProps {
    readonly subtotal: number;
    readonly form: any;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

export function SaleTotals({ subtotal, form }: SaleTotalsProps) {

    // Estados locales para cálculos
    const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
    const [discountPercentage, setDiscountPercentage] = useState<number | string>(0);
    const [surchargeType, setSurchargeType] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
    const [surchargePercentage, setSurchargePercentage] = useState<number | string>(0);

    // Estados para crear impuesto
    const [isCreateTaxOpen, setIsCreateTaxOpen] = useState(false);
    const [newTaxName, setNewTaxName] = useState('');
    const [newTaxPercentage, setNewTaxPercentage] = useState('');
    const [pendingTaxIndex, setPendingTaxIndex] = useState<number | null>(null);

    // Queries y Mutaciones
    const { data: taxTypes } = useTaxTypes();
    const createTaxMutation = useCreateTaxType();

    // Field Array para impuestos
    const {
        fields: taxFields,
        append: appendTax,
        remove: removeTax,
    } = useFieldArray({
        control: form.control,
        name: 'taxes',
    });

    // Observar valores
    const discount = form.watch('discount') || 0;
    const surcharge = form.watch('surcharge') || 0;
    const taxes = form.watch('taxes');

    // Calcular totales
    const totalTaxAmount = taxes?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
    const total = subtotal + totalTaxAmount - discount + surcharge;

    // Hooks de efectos (Lógica de negocio)
    useDiscountCalculation(form, subtotal, discountType, discountPercentage, discount);
    useSurchargeCalculation(form, subtotal, surchargeType, surchargePercentage, surcharge);
    useTaxAmountCalculation(form, subtotal, taxes);
    useTaxSync(form, totalTaxAmount);

    // Handlers
    const handleCreateTax = async () => {
        if (!newTaxName || !newTaxPercentage) return;

        try {
            const newTax = await createTaxMutation.mutateAsync({
                name: newTaxName,
                percentage: Number.parseFloat(newTaxPercentage),
            });

            if (pendingTaxIndex === null) {
                appendTax({ name: newTax.name, percentage: newTax.percentage || 0, amount: 0 });
            } else {
                form.setValue(`taxes.${pendingTaxIndex}.name`, newTax.name);
                form.setValue(`taxes.${pendingTaxIndex}.percentage`, newTax.percentage || 0);
                const amount = (subtotal * (newTax.percentage || 0)) / 100;
                form.setValue(`taxes.${pendingTaxIndex}.amount`, Number(amount.toFixed(2)));
            }

            setIsCreateTaxOpen(false);
            setNewTaxName('');
            setNewTaxPercentage('');
            setPendingTaxIndex(null);
            toast.success('Impuesto creado exitosamente');
        } catch {
            // Error ya manejado por toast en la mutación
            toast.error('Error al crear el impuesto');
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-xl">
            <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between text-sm opacity-80">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* Descuento */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm opacity-80">Descuento</span>
                        <Select
                            value={discountType}
                            onValueChange={(val: 'FIXED' | 'PERCENTAGE') => {
                                setDiscountType(val);
                                if (val === 'PERCENTAGE' && subtotal > 0) {
                                    setDiscountPercentage(Number(((discount / subtotal) * 100).toFixed(2)));
                                }
                            }}
                        >
                            <SelectTrigger className="h-7 w-14 bg-white/10 border-white/20 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">%</SelectItem>
                                <SelectItem value="FIXED">$</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        {discountType === 'PERCENTAGE' ? (
                            <NumericInput
                                className="h-8 w-20 text-right bg-white/10 border-white/20 text-white"
                                value={discountPercentage}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setDiscountPercentage(e.target.value === '' ? '' : Number.parseFloat(e.target.value) || '')}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                    <NumericInput
                                        className="h-8 w-20 text-right bg-white/10 border-white/20 text-white"
                                        value={field.value}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number.parseFloat(e.target.value) || 0)}
                                    />
                                )}
                            />
                        )}
                        {discount > 0 ? (
                            <span className="text-red-400 text-sm">
                                -{formatCurrency(discount)}
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Recargo */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm opacity-80">Recargo</span>
                        <Select
                            value={surchargeType}
                            onValueChange={(val: 'FIXED' | 'PERCENTAGE') => {
                                setSurchargeType(val);
                                if (val === 'PERCENTAGE' && subtotal > 0) {
                                    setSurchargePercentage(Number(((surcharge / subtotal) * 100).toFixed(2)));
                                }
                            }}
                        >
                            <SelectTrigger className="h-7 w-14 bg-white/10 border-white/20 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">%</SelectItem>
                                <SelectItem value="FIXED">$</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        {surchargeType === 'PERCENTAGE' ? (
                            <NumericInput
                                className="h-8 w-20 text-right bg-white/10 border-white/20 text-white"
                                value={surchargePercentage}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setSurchargePercentage(e.target.value === '' ? '' : Number.parseFloat(e.target.value) || '')}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="surcharge"
                                render={({ field }) => (
                                    <NumericInput
                                        className="h-8 w-20 text-right bg-white/10 border-white/20 text-white"
                                        value={field.value}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number.parseFloat(e.target.value) || 0)}
                                    />
                                )}
                            />
                        )}
                        {surcharge > 0 ? (
                            <span className="text-green-400 text-sm">
                                +{formatCurrency(surcharge)}
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Impuestos (Dinámicos) */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm opacity-80">Impuestos</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs hover:bg-white/10 hover:text-white px-2"
                            onClick={() => appendTax({ name: '', percentage: 0, amount: 0 })}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                        </Button>
                    </div>

                    {taxFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name={`taxes.${index}.name`}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={(val) => {
                                            if (val === 'new') {
                                                setPendingTaxIndex(index);
                                                setIsCreateTaxOpen(true);
                                                return;
                                            }
                                            const selectedTax = taxTypes?.find(t => t.name === val);
                                            if (selectedTax) {
                                                field.onChange(val);
                                                form.setValue(`taxes.${index}.percentage`, selectedTax.percentage || 0);
                                                const amount = (subtotal * (selectedTax.percentage || 0)) / 100;
                                                form.setValue(`taxes.${index}.amount`, Number(amount.toFixed(2)));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-7 bg-white/5 border-white/10 text-xs flex-1">
                                            <SelectValue placeholder="Impuesto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {taxTypes?.map((tax) => (
                                                <SelectItem key={tax.id} value={tax.name}>
                                                    {tax.name} ({tax.percentage}%)
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="new" className="text-primary font-medium">
                                                + Crear nuevo
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <div className="w-20 text-right text-sm">
                                {formatCurrency(taxes?.[index]?.amount || 0)}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/50 hover:text-red-400 hover:bg-white/10"
                                onClick={() => removeTax(index)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* TOTAL FINAL */}
                <div className="pt-4 mt-4 border-t border-white/20">
                    <div className="flex justify-between items-end">
                        <span className="text-lg font-bold">TOTAL</span>
                        <span className="text-3xl font-bold tracking-tight">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal para crear impuesto */}
            <Dialog open={isCreateTaxOpen} onOpenChange={setIsCreateTaxOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Tipo de Impuesto</DialogTitle>
                        <DialogDescription>
                            Agregá un impuesto personalizado para usar en esta venta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input
                                placeholder="Ej: Impuesto Interno"
                                value={newTaxName}
                                onChange={(e) => setNewTaxName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Porcentaje (%)</Label>
                            <div className="relative">
                                <NumericInput
                                    placeholder="0.00"
                                    value={newTaxPercentage}
                                    onChange={(e) => setNewTaxPercentage(e.target.value)}
                                    className="pr-8"
                                />
                                <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateTaxOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateTax} disabled={createTaxMutation.isPending}>
                            {createTaxMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
