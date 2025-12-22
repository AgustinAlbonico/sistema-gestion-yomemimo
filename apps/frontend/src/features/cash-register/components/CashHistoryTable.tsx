import { useState } from 'react';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CashRegister, CashRegisterStatus, PaginationMeta } from '../types';
import { CashHistoryDetailDialog } from './CashHistoryDetailDialog';

interface CashHistoryTableProps {
    readonly history: CashRegister[];
    readonly meta?: PaginationMeta;
    readonly onPageChange?: (page: number) => void;
}

const statusLabels: Record<CashRegisterStatus, string> = {
    open: 'Abierta',
    closed: 'Cerrada',
};

const statusVariants: Record<CashRegisterStatus, 'default' | 'secondary'> = {
    open: 'default',
    closed: 'secondary',
};

export function CashHistoryTable({ history, meta, onPageChange }: CashHistoryTableProps) {
    const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const handleViewDetail = (registerId: string) => {
        setSelectedRegisterId(registerId);
        setDetailDialogOpen(true);
    };

    const handlePreviousPage = () => {
        if (meta && meta.page > 1 && onPageChange) {
            onPageChange(meta.page - 1);
        }
    };

    const handleNextPage = () => {
        if (meta && meta.page < meta.totalPages && onPageChange) {
            onPageChange(meta.page + 1);
        }
    };

    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No hay historial de cajas
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Abierta por</TableHead>
                            <TableHead>Cerrada por</TableHead>
                            <TableHead className="text-right">Inicial</TableHead>
                            <TableHead className="text-right">Ingresos</TableHead>
                            <TableHead className="text-right">Egresos</TableHead>
                            <TableHead className="text-right">Diferencia</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((register) => {
                            // La diferencia solo tiene sentido si la caja está cerrada
                            const isClosed = register.status === 'closed';
                            const hasDifference = register.difference !== null && register.difference !== undefined;
                            const difference = hasDifference ? Number(register.difference) : 0;

                            return (
                                <TableRow key={register.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{formatDate(register.date)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(register.openedAt).toLocaleTimeString('es-AR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                {register.closedAt &&
                                                    ` - ${new Date(register.closedAt).toLocaleTimeString('es-AR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}`}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{register.openedBy?.name || '-'}</TableCell>
                                    <TableCell className="text-sm">
                                        {register.closedBy?.name || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(register.initialAmount)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 font-medium">
                                        +{formatCurrency(register.totalIncome)}
                                    </TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">
                                        -{formatCurrency(register.totalExpense)}
                                    </TableCell>
                                    <TableCell
                                        className={`text-right font-semibold ${!isClosed
                                            ? 'text-muted-foreground'
                                            : difference > 0
                                                ? 'text-green-600'
                                                : difference < 0
                                                    ? 'text-red-600'
                                                    : 'text-muted-foreground'
                                            }`}
                                    >
                                        {!isClosed
                                            ? '-'
                                            : hasDifference
                                                ? difference === 0
                                                    ? 'Exacto'
                                                    : `${difference > 0 ? '+' : ''}${formatCurrency(difference)}`
                                                : 'Sin dato'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariants[register.status]}>
                                            {statusLabels[register.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetail(register.id)}
                                            title="Ver detalle de movimientos"
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

            {/* Controles de paginación */}
            {meta && meta.totalPages > 1 ? (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {((meta.page - 1) * meta.limit) + 1} a {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} registros
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={meta.page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                        </Button>
                        <div className="text-sm font-medium">
                            Página {meta.page} de {meta.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={meta.page === meta.totalPages}
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            ) : null}

            {/* Diálogo de detalle */}
            <CashHistoryDetailDialog
                registerId={selectedRegisterId}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
            />
        </>
    );
}
