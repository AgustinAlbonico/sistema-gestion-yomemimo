import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { CashMovement } from '../types';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';
import { ArrowDownLeft, ArrowUpRight, Eye } from 'lucide-react';
import { useState } from 'react';
import { CashMovementDetailDialog } from './CashMovementDetailDialog';

interface CashMovementsTableProps {
    movements: CashMovement[];
}

export function CashMovementsTable({ movements }: CashMovementsTableProps) {
    const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const handleViewDetails = (movement: CashMovement) => {
        setSelectedMovement(movement);
        setDetailDialogOpen(true);
    };

    if (movements.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10">
                No hay movimientos registrados
            </div>
        );
    }

    // Ordenar movimientos por fecha descendente (más reciente primero)
    const sortedMovements = [...movements].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <>
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[80px]">Hora</TableHead>
                            <TableHead className="w-[110px]">Tipo</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="w-[150px]">Método de Pago</TableHead>
                            <TableHead className="text-right w-[130px]">Monto</TableHead>
                            <TableHead className="w-[80px] text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedMovements.map((movement) => {
                            const isIncome = movement.movementType === 'income';
                            const amount = Number(movement.amount);

                            return (
                                <TableRow key={movement.id} className="hover:bg-muted/30">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {new Date(movement.createdAt).toLocaleTimeString('es-AR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={isIncome ? 'default' : 'destructive'}
                                            className={`text-[10px] px-2 py-0.5 h-5 font-medium ${isIncome ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200' : 'bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-200'
                                                }`}
                                        >
                                            {isIncome ? (
                                                <ArrowDownLeft className="h-3 w-3 mr-1" />
                                            ) : (
                                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                            )}
                                            {isIncome ? 'INGRESO' : 'EGRESO'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium text-sm">{movement.description}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1 rounded-full ${isIncome ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                                {getPaymentMethodIcon(movement.paymentMethod?.code || '')}
                                            </div>
                                            <span className="text-xs font-medium">{movement.paymentMethod?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-mono font-semibold text-base ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                             {formatCurrency(Math.abs(amount))}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleViewDetails(movement)}
                                            title="Ver detalles"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <CashMovementDetailDialog
                movement={selectedMovement}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
            />
        </>
    );
}
