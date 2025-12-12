/**
 * Página de Configuración del Sistema
 * - % de ganancia por defecto
 * - Stock mínimo global para alertas
 * - Botón para actualizar todos los precios
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Percent, Save, RefreshCw, Package, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SystemConfiguration {
    id: string;
    defaultProfitMargin: number;
    minStockAlert: number;
    createdAt: string;
    updatedAt: string;
}

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [profitMargin, setProfitMargin] = useState('');
    const [minStock, setMinStock] = useState('');

    // Obtener configuración actual
    const { data: config, isLoading } = useQuery({
        queryKey: ['configuration'],
        queryFn: async (): Promise<SystemConfiguration> => {
            const res = await api.get('/api/configuration');
            return res.data;
        },
    });

    // Actualizar cuando se carga la configuración
    useEffect(() => {
        if (config) {
            setProfitMargin(Number(config.defaultProfitMargin).toString());
            setMinStock(Number(config.minStockAlert).toString());
        }
    }, [config]);

    // Mutation para guardar configuración
    const saveMutation = useMutation({
        mutationFn: async (data: { defaultProfitMargin?: number; minStockAlert?: number }) => {
            const res = await api.patch('/api/configuration', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['configuration'] });
            queryClient.invalidateQueries({ queryKey: ['inventory', 'low-stock'] });
            toast.success('Configuración guardada');
        },
        onError: () => {
            toast.error('Error al guardar');
        },
    });

    // Mutation para actualizar todos los precios
    const updatePricesMutation = useMutation({
        mutationFn: async (margin: number) => {
            const res = await api.post('/api/configuration/update-all-prices', { defaultProfitMargin: margin });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['configuration'] });
            toast.success(`¡${data.updated} productos actualizados al ${data.margin}% de ganancia!`);
        },
        onError: () => {
            toast.error('Error al actualizar precios');
        },
    });

    const handleSave = () => {
        const margin = Number.parseFloat(profitMargin);
        const stock = Number.parseInt(minStock);

        if (Number.isNaN(margin) || margin < 0) {
            toast.error('Ingrese un % de ganancia válido');
            return;
        }
        if (Number.isNaN(stock) || stock < 0) {
            toast.error('Ingrese un stock mínimo válido');
            return;
        }

        saveMutation.mutate({
            defaultProfitMargin: margin,
            minStockAlert: stock,
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>;
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración</h1>
                    <p className="text-muted-foreground">
                        Ajustes generales del sistema
                    </p>
                </div>
            </div>

            {/* Card 1: Margen de Ganancia */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-lg">% de Ganancia</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Porcentaje que se suma al costo para calcular el precio de venta
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Label htmlFor="profitMargin">Porcentaje</Label>
                            <div className="flex gap-2 items-center mt-1">
                                <NumericInput
                                    id="profitMargin"
                                    value={profitMargin}
                                    onChange={(e) => setProfitMargin(e.target.value)}
                                    className="max-w-[150px]"
                                />
                                <span className="text-muted-foreground font-medium">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm text-muted-foreground mb-2">Ejemplo:</p>
                        <div className="flex items-center justify-between">
                            <span>Costo $100</span>
                            <span className="text-muted-foreground">+{profitMargin || 0}%</span>
                            <span className="font-bold text-green-600">
                                = ${(100 * (1 + (Number.parseFloat(profitMargin) || 0) / 100)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Botón para aplicar porcentaje a todos los productos (moved here) */}
                <div className="p-6">
                    <Button
                        onClick={() => {
                            const margin = Number.parseFloat(profitMargin);
                            if (Number.isNaN(margin) || margin < 0) {
                                toast.error('Ingrese un % de ganancia válido');
                                return;
                            }
                            updatePricesMutation.mutate(margin);
                        }}
                        disabled={updatePricesMutation.isPending}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${updatePricesMutation.isPending ? 'animate-spin' : ''}`} />
                        {updatePricesMutation.isPending ? 'Actualizando...' : 'Aplicar % a todos los productos'}
                    </Button>
                </div>
            </div>

            {/* Card 2: Stock Mínimo */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-semibold text-lg">Stock Mínimo</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Te avisaremos cuando algún producto tenga menos de esta cantidad
                    </p>
                </div>

                <div className="p-6">
                    <div className="flex gap-2 items-center">
                        <NumericInput
                            allowDecimals={false}
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            className="max-w-[150px]"
                        />
                        <span className="text-muted-foreground">unidades</span>
                    </div>
                </div>
            </div>

            {/* Botón Guardar */}
            <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full"
                size="lg"
            >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </Button>

            {/* Card: Facturación Fiscal */}
            <Link to="/settings/fiscal" className="block">
                <div className="rounded-lg border bg-card shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Facturación Fiscal (AFIP)</h3>
                                <p className="text-sm text-muted-foreground">
                                    Configurar datos del emisor, certificados y entorno AFIP
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </Link>
        </div>
    );
}

