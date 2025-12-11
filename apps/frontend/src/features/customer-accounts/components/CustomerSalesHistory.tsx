/**
 * Componente de historial de compras del cliente
 * Muestra todas las ventas realizadas a un cliente específico
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingBag, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { salesApi } from '@/features/sales/api/sales.api';
import {
    SaleStatus,
    SaleStatusLabels,
    SaleStatusColors,
} from '@/features/sales/types';
import { SaleDetailDialog } from './SaleDetailDialog';

interface CustomerSalesHistoryProps {
    customerId: string;
}

export function CustomerSalesHistory({ customerId }: CustomerSalesHistoryProps) {
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const { data: salesData, isLoading } = useQuery({
        queryKey: ['customer-sales', customerId],
        queryFn: () =>
            salesApi.getAll({
                customerId,
                limit: 50, // Mostrar últimas 50 ventas
                order: 'DESC',
            }),
        enabled: !!customerId,
    });

    const handleViewSale = (saleId: string) => {
        setSelectedSaleId(saleId);
        setDetailDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Historial de Compras
                    {salesData && ` (${salesData.total})`}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <p className="text-muted-foreground">Cargando historial...</p>
                    </div>
                ) : salesData && salesData.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-3 text-left">N° Venta</th>
                                    <th className="py-3 text-left">Fecha</th>
                                    <th className="py-3 text-center">Items</th>
                                    <th className="py-3 text-right">Total</th>
                                    <th className="py-3 text-center">Estado</th>
                                    <th className="py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData.data.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="border-b hover:bg-muted/50 cursor-pointer"
                                        onClick={() => handleViewSale(sale.id)}
                                    >
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {sale.saleNumber}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-muted-foreground">
                                            {format(
                                                new Date(sale.saleDate),
                                                'dd/MM/yyyy',
                                                { locale: es }
                                            )}
                                        </td>
                                        <td className="py-3 text-center text-muted-foreground">
                                            {sale.items.length}
                                        </td>
                                        <td className="py-3 text-right font-semibold">
                                            ${Number(sale.total).toFixed(2)}
                                        </td>
                                        <td className="py-3 text-center">
                                            <Badge
                                                className={
                                                    SaleStatusColors[sale.status as SaleStatus]
                                                }
                                            >
                                                {SaleStatusLabels[sale.status as SaleStatus]}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-center">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewSale(sale.id);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">Sin compras registradas</p>
                        <p className="text-sm text-muted-foreground">
                            Este cliente aún no tiene historial de compras
                        </p>
                    </div>
                )}
            </CardContent>

            {/* Diálogo de detalle de venta */}
            <SaleDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                saleId={selectedSaleId}
            />
        </Card>
    );
}
