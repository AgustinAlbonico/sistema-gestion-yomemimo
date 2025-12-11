/**
 * Tabla de productos más vendidos
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { TopProduct } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopProductsTableProps {
    products: TopProduct[];
    isLoading?: boolean;
    title?: string;
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
                                        <TableCell className="text-right font-medium">
                                            {product.quantitySold.toLocaleString('es-AR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(product.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={product.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                {formatCurrency(product.profit)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
