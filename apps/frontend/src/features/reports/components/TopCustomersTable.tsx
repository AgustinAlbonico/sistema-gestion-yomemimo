/**
 * Tabla de top clientes
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TopCustomer } from '../types';
import { User, Mail, Phone } from 'lucide-react';

interface TopCustomersTableProps {
    readonly customers: TopCustomer[];
    readonly isLoading?: boolean;
    readonly title?: string;
}

export function TopCustomersTable({ customers, isLoading, title = 'Top Clientes' }: TopCustomersTableProps) {
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
                {customers.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        No hay clientes registrados en este período
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="text-right">Compras</TableHead>
                                    <TableHead className="text-right">Total Gastado</TableHead>
                                    <TableHead className="text-right">Ticket Prom.</TableHead>
                                    <TableHead className="text-right">Última Compra</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer, index) => (
                                    <TableRow key={customer.customerId}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{customer.customerName}</p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        {customer.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {customer.email}
                                                            </span>
                                                        )}
                                                        {customer.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {customer.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {customer.totalPurchases}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-emerald-600">
                                            {formatCurrency(customer.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(customer.averageTicket)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {formatDate(customer.lastPurchaseDate)}
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
