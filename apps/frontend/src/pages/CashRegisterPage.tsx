import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, RefreshCw, Lock, Printer } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useOpenCashRegister, useCashHistory, useReopenCashRegisterMutation } from '../features/cash-register/hooks';
import { OpenCashDialog } from '../features/cash-register/components/OpenCashDialog';
import { CloseCashDialog } from '../features/cash-register/components/CloseCashDialog';
import { CashMovementsTable } from '../features/cash-register/components/CashMovementsTable';
import { CashHistoryTable } from '../features/cash-register/components/CashHistoryTable';
import { CashFlowReportDialog } from '../features/cash-register/components/CashFlowReportDialog';
import { CashRegisterSummary } from '../features/cash-register/components/CashRegisterSummary';
import { getTodayLocal } from '@/lib/date-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CashRegisterPage() {
    const { data: openRegister, isLoading: isLoadingCurrent } = useOpenCashRegister();
    const { data: history, isLoading: isLoadingHistory } = useCashHistory();
    const reopenMutation = useReopenCashRegisterMutation();
    const [openDialogOpen, setOpenDialogOpen] = useState(false);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    // Buscar la caja cerrada de hoy en el historial
    const today = getTodayLocal();
    const todaysClosedRegister = history?.find(
        (register) => register.date.split('T')[0] === today && register.status === 'closed'
    );

    if (isLoadingCurrent) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
                    <p className="text-muted-foreground">
                        Gestión de movimientos y arqueo de caja
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setReportDialogOpen(true)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Reportes
                    </Button>
                    {openRegister ? (
                        <Button onClick={() => setCloseDialogOpen(true)} variant="destructive">
                            <Lock className="h-4 w-4 mr-2" />
                            Cerrar Caja
                        </Button>
                    ) : (
                        <Button onClick={() => setOpenDialogOpen(true)}>
                            Abrir Caja
                        </Button>
                    )}
                </div>
            </div>

            {/* Caja Cerrada de Hoy - Para Reabrir */}
            {!openRegister && todaysClosedRegister && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 shrink-0">
                    <CardContent className="flex items-center justify-between p-4">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <div className="h-3 w-3 bg-orange-500 rounded-full" />
                                Caja Cerrada de Hoy
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Cerrada por {todaysClosedRegister.closedBy?.name} el{' '}
                                {formatDateTime(todaysClosedRegister.closedAt!)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Total final: {formatCurrency(todaysClosedRegister.actualAmount ?? 0)}
                            </p>
                        </div>
                        <Button
                            onClick={() => reopenMutation.mutate(todaysClosedRegister.id)}
                            disabled={reopenMutation.isPending}
                            variant="outline"
                            className="border-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${reopenMutation.isPending ? 'animate-spin' : ''}`} />
                            Reabrir Caja
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Contenido Principal */}
            {openRegister ? (
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                    {/* Header de Caja Abierta */}
                    <div className="flex items-center justify-between bg-card border rounded-lg p-4 shadow-sm shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Caja Abierta</h3>
                                <p className="text-xs text-muted-foreground">
                                    Apertura: {formatDateTime(openRegister.openedAt)} por {openRegister.openedBy.name}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Inicial</p>
                            <p className="font-mono font-bold text-lg">{formatCurrency(openRegister.initialAmount)}</p>
                        </div>
                    </div>

                    {/* Tabla de Movimientos (Scrollable) */}
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">Movimientos del Día</h3>
                            <Badge variant="outline" className="font-mono">
                                {openRegister.movements.length} registros
                            </Badge>
                        </div>
                        <div className="flex-1 overflow-auto border rounded-md bg-card">
                            <CashMovementsTable movements={openRegister.movements} />
                        </div>
                    </div>

                    {/* Resumen de Totales (Footer) */}
                    <div className="shrink-0">
                        <CashRegisterSummary register={openRegister} />
                    </div>
                </div>
            ) : (
                <div className="flex-1">
                    <Tabs defaultValue="history" className="w-full">
                        <TabsList>
                            <TabsTrigger value="history">Historial de Cajas</TabsTrigger>
                        </TabsList>
                        <TabsContent value="history" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial de Cajas</CardTitle>
                                    <CardDescription>Registro de cajas anteriores</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingHistory ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : (
                                        <CashHistoryTable history={history || []} />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Diálogos */}
            <OpenCashDialog open={openDialogOpen} onOpenChange={setOpenDialogOpen} />
            <CloseCashDialog
                open={closeDialogOpen}
                onOpenChange={setCloseDialogOpen}
                currentRegister={openRegister || null}
            />
            <CashFlowReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className} ${variant === 'outline' ? 'text-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/80'}`}>
            {children}
        </span>
    )
}

