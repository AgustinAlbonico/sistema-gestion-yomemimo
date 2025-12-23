import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, User, DollarSign, AlertCircle } from 'lucide-react';
import { cashRegisterApi } from '../api';
import type { CashRegisterStatus } from '../types';
import { CashMovementsTable } from './CashMovementsTable';
import { CashRegisterSummary } from './CashRegisterSummary';

interface CashHistoryDetailDialogProps {
    /** ID de la caja a mostrar */
    readonly registerId: string | null;
    /** Estado de apertura del diálogo */
    readonly open: boolean;
    /** Callback para cambiar estado de apertura */
    readonly onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<CashRegisterStatus, string> = {
    open: 'Abierta',
    closed: 'Cerrada',
};

const statusVariants: Record<CashRegisterStatus, 'default' | 'secondary'> = {
    open: 'default',
    closed: 'secondary',
};

/**
 * Diálogo para mostrar el detalle de una caja del historial,
 * incluyendo información de apertura/cierre y todos los movimientos.
 */
export function CashHistoryDetailDialog({
    registerId,
    open,
    onOpenChange
}: CashHistoryDetailDialogProps) {
    // Fetch de los datos de la caja seleccionada
    const { data: register, isLoading, error } = useQuery({
        queryKey: ['cash-register', registerId],
        queryFn: () => cashRegisterApi.getById(registerId!),
        enabled: !!registerId && open,
    });

    if (!registerId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5" />
                        Detalle de Caja - {register ? formatDate(register.date) : ''}
                        {register && (
                            <Badge variant={statusVariants[register.status]}>
                                {statusLabels[register.status]}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Estado de carga */}
                {isLoading && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }, (_, i) => (
                                <Skeleton key={`skeleton-${i}`} className="h-20 w-full" />
                            ))}
                        </div>
                        <Skeleton className="h-64 w-full" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                        <span>Error al cargar los datos de la caja</span>
                    </div>
                )}

                {/* Contenido */}
                {register && !isLoading && (
                    <div className="space-y-6 py-4">
                        {/* Información básica de la caja */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Fecha */}
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-wider">Fecha</span>
                                    </div>
                                    <p className="font-semibold">{formatDate(register.date)}</p>
                                </CardContent>
                            </Card>

                            {/* Horarios */}
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-wider">Horario</span>
                                    </div>
                                    <p className="font-semibold text-sm">
                                        {new Date(register.openedAt).toLocaleTimeString('es-AR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {register.closedAt && (
                                            <span className="text-muted-foreground">
                                                {' - '}
                                                {new Date(register.closedAt).toLocaleTimeString('es-AR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        )}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Abierta por */}
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <User className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-wider">Abierta por</span>
                                    </div>
                                    <p className="font-semibold text-sm truncate">{register.openedBy?.name || '-'}</p>
                                </CardContent>
                            </Card>

                            {/* Cerrada por */}
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <User className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-wider">Cerrada por</span>
                                    </div>
                                    <p className="font-semibold text-sm truncate">{register.closedBy?.name || '-'}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Resumen de totales por método de pago */}
                        <div>
                            <h3 className="font-semibold text-lg mb-3">Resumen por Método de Pago</h3>
                            <CashRegisterSummary register={register} />
                        </div>

                        {/* Notas de apertura/cierre */}
                        {(register.openingNotes || register.closingNotes) && (
                            <div className="grid md:grid-cols-2 gap-4">
                                {register.openingNotes && (
                                    <Card>
                                        <CardContent className="pt-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                                Notas de apertura
                                            </p>
                                            <p className="text-sm">{register.openingNotes}</p>
                                        </CardContent>
                                    </Card>
                                )}
                                {register.closingNotes && (
                                    <Card>
                                        <CardContent className="pt-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                                Notas de cierre
                                            </p>
                                            <p className="text-sm">{register.closingNotes}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Tabla de movimientos */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">Movimientos</h3>
                                <Badge variant="outline" className="font-mono">
                                    {register.movements?.length || 0} registros
                                </Badge>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <CashMovementsTable movements={register.movements || []} />
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

