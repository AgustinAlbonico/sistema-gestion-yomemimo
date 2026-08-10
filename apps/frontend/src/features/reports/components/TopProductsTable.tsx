/**
 * Tabla de productos más vendidos.
 *
 * Soporta dos poblaciones de productos:
 * - Con costo conocido (hasKnownCost=true): muestra ganancia y margen.
 * - Precio fijo sin costo (hasKnownCost=false): muestra "—" en ganancia/margen
 *   con badge amarillo "Precio Fijo".
 *
 * Los totales al pie separan Revenue (todos), Ganancia (solo con costo) y
 * Margen % ponderado (solo con costo) para no mezclar métricas.
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { TopProduct } from '../types';
import { TrendingUp, TrendingDown, Tag } from 'lucide-react';

interface TopProductsTableProps {
    readonly products: TopProduct[];
    readonly isLoading?: boolean;
    readonly title?: string;
}

export function TopProductsTable({ products, isLoading, title = 'Top Productos Más Vendidos' }: TopProductsTableProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const productsWithCost = products.filter(p => p.hasKnownCost);
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = productsWithCost.reduce((sum, p) => sum + (p.profit ?? 0), 0);
    const weightedMargin = totalRevenue > 0 && productsWithCost.length > 0
        ? (totalProfit / productsWithCost.reduce((sum, p) => sum + p.revenue, 0)) * 100
        : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {products.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        No hay productos vendidos en este período
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Tipo</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Ingresos</TableHead>
                                    <TableHead className="text-right">Ganancia</TableHead>
                                    <TableHead className="text-right">Margen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product, index) => (
                                    <TableRow key={product.productId}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{product.productName}</p>
                                                {product.productSku && (
                                                    <p className="text-xs text-muted-foreground">
                                                        SKU: {product.productSku}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.hasKnownCost ? (
                                                <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                                                    Con margen
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    Precio Fijo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {product.quantitySold.toLocaleString('es-AR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(product.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.profit === null ? (
                                                <span className="text-muted-foreground">—</span>
                                            ) : (
                                                <span className={product.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                    {formatCurrency(product.profit)}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.margin === null ? (
                                                <span className="text-muted-foreground">—</span>
                                            ) : (
                                                <Badge
                                                    variant={product.margin >= 30 ? 'default' : product.margin >= 15 ? 'secondary' : 'destructive'}
                                                    className="flex items-center gap-1 w-fit ml-auto"
                                                >
                                                    {product.margin >= 30 ? (
                                                        <TrendingUp className="h-3 w-3" />
                                                    ) : product.margin < 15 ? (
                                                        <TrendingDown className="h-3 w-3" />
                                                    ) : null}
                                                    {product.margin.toFixed(1)}%
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4} className="font-semibold">
                                        Totales
                                        {productsWithCost.length < products.length && (
                                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                (ganancia y margen solo consideran productos con costo)
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(totalRevenue)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {productsWithCost.length > 0 ? formatCurrency(totalProfit) : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {weightedMargin !== null ? (
                                            <Badge variant="outline" className="font-semibold">
                                                {weightedMargin.toFixed(1)}%
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
