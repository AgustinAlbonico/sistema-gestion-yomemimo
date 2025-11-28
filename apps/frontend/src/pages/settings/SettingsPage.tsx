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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Percent, Save, RefreshCw, Package } from 'lucide-react';

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
            toast.success('Configuración guardada');
        },
        onError: () => {
            toast.error('Error al guardar');
        },
    });

    // Mutation para actualizar todos los precios
    const updatePricesMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/api/configuration/update-all-prices');
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(`¡${data.updated} productos actualizados al ${data.margin}% de ganancia!`);
        },
        onError: () => {
            toast.error('Error al actualizar precios');
        },
    });

    const handleSave = () => {
        const margin = parseFloat(profitMargin);
        const stock = parseInt(minStock);
        
        if (isNaN(margin) || margin < 0) {
            toast.error('Ingrese un % de ganancia válido');
            return;
        }
        if (isNaN(stock) || stock < 0) {
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
        <div className="container mx-auto py-10 max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
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
                                <Input
                                    id="profitMargin"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1000"
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
                                = ${(100 * (1 + (parseFloat(profitMargin) || 0) / 100)).toFixed(2)}
                            </span>
                        </div>
                    </div>
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
                        <Input
                            type="number"
                            step="1"
                            min="0"
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

            {/* Card 3: Actualizar Todos los Precios */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 shadow-sm">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-lg text-orange-800 dark:text-orange-200">
                            Actualizar Todos los Precios
                        </h3>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                        Aplica el {profitMargin || 0}% de ganancia a <strong>todos</strong> los productos.
                        Útil cuando cambiaste los costos de varios productos.
                    </p>
                    <Button 
                        onClick={() => updatePricesMutation.mutate()}
                        disabled={updatePricesMutation.isPending}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${updatePricesMutation.isPending ? 'animate-spin' : ''}`} />
                        {updatePricesMutation.isPending ? 'Actualizando...' : 'Actualizar Precios de Todos los Productos'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

