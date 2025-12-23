/**
 * Página de Estado de Cuenta de un cliente
 * Muestra el detalle de movimientos, historial de compras y permite registrar pagos
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, AlertTriangle, ExternalLink, Filter, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAccountStatement, useSyncMissingCharges } from '../hooks/use-customer-accounts';
import { useOpenCashRegister } from '@/features/cash-register/hooks';
import { PaymentDialog } from '../components/PaymentDialog';
import { CustomerSalesHistory } from '../components/CustomerSalesHistory';
import { SaleDetailDialog } from '../components/SaleDetailDialog';
import { ApplySurchargeDialog } from '../components/ApplySurchargeDialog';
import { MovementType, type CustomerPosition } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// Nombres de meses en español
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Generar años disponibles (desde 2020 hasta el año actual + 1)
const YEARS = Array.from(
    { length: new Date().getFullYear() - 2020 + 2 },
    (_, i) => 2020 + i
).reverse();

export function AccountStatementPage() {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [surchargeDialogOpen, setSurchargeDialogOpen] = useState(false);
    const [saleDetailOpen, setSaleDetailOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

    // Estado para filtro de fecha (por defecto: mostrar todos)
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
    const [showAllMovements, setShowAllMovements] = useState(true); // Por defecto mostrar todos

    // Estado para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15; // Movimientos por página

    const { data: statement, isLoading } = useAccountStatement(customerId);
    const { data: openCashRegister } = useOpenCashRegister();
    const syncMutation = useSyncMissingCharges();

    // Verificar si hay caja abierta
    const isCashRegisterOpen = !!openCashRegister;

    // Ref para evitar sincronización duplicada
    const hasSyncedRef = useRef(false);

    // Sincronizar cargos faltantes automáticamente al cargar la página
    useEffect(() => {
        // Solo sincronizar una vez, cuando tenemos customerId y la data ya cargó
        if (customerId && !isLoading && !hasSyncedRef.current) {
            hasSyncedRef.current = true;
            // Ejecutar sincronización en segundo plano (sin toast si no hay cambios)
            syncMutation.mutate(customerId, {
                onSuccess: (result) => {
                    // Solo mostrar notificación si se crearon cargos
                    // (la mutación ya maneja esto internamente)
                    if (result.chargesCreated > 0) {
                        console.log(`[AccountStatement] Sincronizados ${result.chargesCreated} cargos automáticamente`);
                    }
                },
            });
        }
    }, [customerId, isLoading, syncMutation]);

    // Extraer datos del statement (con valores por defecto para evitar error de hooks)
    const account = statement?.account;
    const movements = statement?.movements ?? [];
    const summary = statement?.summary;

    // Filtrar movimientos por mes/año seleccionado
    // IMPORTANTE: Este hook debe estar ANTES de cualquier return condicional
    const filteredMovements = useMemo(() => {
        if (!movements.length) return [];

        if (showAllMovements) {
            // Ordenar del más reciente al más antiguo
            return [...movements].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }

        // Crear rango de fechas para el mes seleccionado
        const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
        const endDate = endOfMonth(new Date(selectedYear, selectedMonth));

        return movements
            .filter(m => {
                const movementDate = new Date(m.createdAt);
                return isWithinInterval(movementDate, { start: startDate, end: endDate });
            })
            .sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
    }, [movements, selectedMonth, selectedYear, showAllMovements]);

    // Calcular paginación
    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
    const paginatedMovements = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredMovements.slice(startIndex, endIndex);
    }, [filteredMovements, currentPage, itemsPerPage]);

    // Resetear a página 1 cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [showAllMovements, selectedMonth, selectedYear]);

    // Returns condicionales DESPUÉS de todos los hooks
    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <p className="text-muted-foreground">Cargando estado de cuenta...</p>
            </div>
        );
    }

    if (!statement || !account || !summary) {
        return (
            <div className="flex h-96 flex-col items-center justify-center">
                <p className="text-lg font-medium">No se encontró la cuenta</p>
                <Button className="mt-4" onClick={() => navigate('/customer-accounts')}>
                    Volver
                </Button>
            </div>
        );
    }

    const getPositionText = (position: CustomerPosition) => {
        if (position === 'customer_owes') {
            return {
                text: 'El cliente debe',
                className: 'text-red-600',
            };
        } else if (position === 'business_owes') {
            return {
                text: 'Saldo a favor del cliente',
                className: 'text-green-600',
            };
        } else {
            return {
                text: 'Cuenta saldada',
                className: 'text-gray-600',
            };
        }
    };

    const positionInfo = getPositionText(summary.customerPosition);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/customer-accounts')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>

            {/* Info del Cliente */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {account.customer &&
                            `${account.customer.firstName} ${account.customer.lastName}`}
                    </CardTitle>
                    {account.customer?.email && (
                        <p className="text-sm text-muted-foreground">
                            {account.customer.email}
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div>
                            <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                Saldo Actual
                            </label>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-4xl font-bold ${positionInfo.className}`}>
                                    ${Math.abs(Number(account.balance)).toFixed(2)}
                                </p>
                            </div>
                            <p className={`mt-1 text-sm ${positionInfo.className}`}>
                                {positionInfo.text}
                            </p>
                        </div>

                        <div>
                            <span className="mb-1 text-sm text-muted-foreground block">
                                Límite de Crédito
                            </span>
                            <p className="text-2xl font-bold">
                                ${Number(account.creditLimit).toFixed(2)}
                            </p>
                            {Number(account.creditLimit) > 0 && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Usado:{' '}
                                    {((Number(account.balance) / Number(account.creditLimit)) * 100).toFixed(
                                        1
                                    )}
                                    %
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Días de Mora
                            </label>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold">
                                    {account.daysOverdue} días
                                </p>
                                {account.daysOverdue > 0 && (
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                )}
                            </div>
                            {account.lastPaymentDate && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Último pago:{' '}
                                    {format(
                                        new Date(account.lastPaymentDate),
                                        'dd/MM/yyyy',
                                        { locale: es }
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Cargos</p>
                            <p className="text-xl font-semibold">
                                ${Number(summary.totalCharges).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Pagos</p>
                            <p className="text-xl font-semibold text-green-600">
                                ${Number(summary.totalPayments).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Balance Neto</p>
                            <p
                                className={`text-xl font-semibold ${positionInfo.className}`}
                            >
                                ${Math.abs(Number(summary.currentBalance)).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-6 flex flex-wrap gap-2 border-t pt-6">
                        <Button
                            onClick={() => {
                                if (!isCashRegisterOpen) {
                                    toast.error('No puedes registrar pagos sin tener la caja abierta. Por favor, abre la caja primero.');
                                    return;
                                }
                                setPaymentDialogOpen(true);
                            }}
                            disabled={Number(account.balance) <= 0}
                        >
                            Registrar Pago
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSurchargeDialogOpen(true)}
                            disabled={Number(account.balance) <= 0}
                            className="border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                        >
                            <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                            Aplicar Recargo
                        </Button>
                        {Number(account.balance) <= 0 && (
                            <p className="flex items-center text-sm text-muted-foreground">
                                No hay deuda pendiente
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs: Movimientos e Historial de Compras */}
            <Tabs defaultValue="movements" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="movements">Movimientos</TabsTrigger>
                    <TabsTrigger value="purchases">Historial de Compras</TabsTrigger>
                </TabsList>

                <TabsContent value="movements">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <CardTitle>Movimientos de Cuenta</CardTitle>

                                {/* Filtros de fecha */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />

                                    <Select
                                        value={selectedMonth.toString()}
                                        onValueChange={(v) => {
                                            setSelectedMonth(Number.parseInt(v));
                                            setShowAllMovements(false);
                                        }}
                                        disabled={showAllMovements}
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((month, idx) => (
                                                <SelectItem key={idx} value={idx.toString()}>
                                                    {month}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(v) => {
                                            setSelectedYear(Number.parseInt(v));
                                            setShowAllMovements(false);
                                        }}
                                        disabled={showAllMovements}
                                    >
                                        <SelectTrigger className="w-[90px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant={showAllMovements ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowAllMovements(!showAllMovements)}
                                    >
                                        {showAllMovements ? "Mostrando todos" : "Ver todos"}
                                    </Button>
                                </div>
                            </div>

                            {/* Indicador de período */}
                            <p className="text-sm text-muted-foreground mt-2">
                                {showAllMovements
                                    ? `Mostrando ${filteredMovements.length} movimiento(s) de todos los tiempos`
                                    : `Mostrando ${filteredMovements.length} movimiento(s) de ${MONTHS[selectedMonth]} ${selectedYear}`
                                }
                            </p>
                        </CardHeader>
                        <CardContent>
                            {filteredMovements.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="py-3 text-left">Fecha</th>
                                                    <th className="py-3 text-left">Descripción</th>
                                                    <th className="py-3 text-left">Tipo</th>
                                                    <th className="py-3 text-right">Debe</th>
                                                    <th className="py-3 text-right">Haber</th>
                                                    <th className="py-3 text-right">Saldo</th>
                                                    <th className="py-3 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedMovements.map((movement) => {
                                                    // Verificar si es un cargo con venta asociada
                                                    const hasSaleReference =
                                                        movement.movementType === MovementType.CHARGE &&
                                                        movement.referenceType === 'sale' &&
                                                        movement.referenceId;

                                                    return (
                                                        <tr
                                                            key={movement.id}
                                                            className={`border-b ${hasSaleReference ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
                                                            onClick={() => {
                                                                if (hasSaleReference) {
                                                                    setSelectedSaleId(movement.referenceId);
                                                                    setSaleDetailOpen(true);
                                                                }
                                                            }}
                                                        >
                                                            <td className="py-3">
                                                                {format(
                                                                    new Date(movement.createdAt),
                                                                    'dd/MM/yyyy HH:mm',
                                                                    { locale: es }
                                                                )}
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{movement.description}</span>
                                                                    {movement.paymentMethod && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            ({movement.paymentMethod.name})
                                                                        </span>
                                                                    )}
                                                                    {hasSaleReference && (
                                                                        <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                                                                    )}
                                                                </div>
                                                                {movement.notes && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {movement.notes}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="py-3">
                                                                <Badge
                                                                    variant={
                                                                        movement.movementType ===
                                                                            MovementType.PAYMENT
                                                                            ? 'default'
                                                                            : movement.movementType ===
                                                                                MovementType.CHARGE
                                                                                ? 'destructive'
                                                                                : 'secondary'
                                                                    }
                                                                >
                                                                    {movement.movementType === MovementType.CHARGE && 'Cargo'}
                                                                    {movement.movementType === MovementType.PAYMENT && 'Pago'}
                                                                    {movement.movementType === MovementType.ADJUSTMENT && 'Ajuste'}
                                                                    {movement.movementType === MovementType.DISCOUNT && 'Descuento'}
                                                                    {movement.movementType === MovementType.INTEREST && 'Interés'}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                {Number(movement.amount) > 0 && (
                                                                    <span className="text-red-600">
                                                                        ${Number(movement.amount).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                {Number(movement.amount) < 0 && (
                                                                    <span className="text-green-600">
                                                                        ${Math.abs(Number(movement.amount)).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 text-right font-semibold">
                                                                ${Math.abs(Number(movement.balanceAfter)).toFixed(2)}
                                                            </td>
                                                            <td className="py-3 text-center">
                                                                {hasSaleReference && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedSaleId(movement.referenceId);
                                                                            setSaleDetailOpen(true);
                                                                        }}
                                                                    >
                                                                        Ver Venta
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Controles de paginación */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between border-t pt-4 mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMovements.length)} de {filteredMovements.length} movimientos
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Anterior
                                                </Button>
                                                <span className="text-sm text-muted-foreground px-2">
                                                    Página {currentPage} de {totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Siguiente
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-lg font-medium">No hay movimientos</p>
                                    <p className="text-sm text-muted-foreground">
                                        {showAllMovements
                                            ? 'La cuenta no tiene movimientos registrados'
                                            : `No hay movimientos en ${MONTHS[selectedMonth]} ${selectedYear}`
                                        }
                                    </p>
                                    {!showAllMovements && movements.length > 0 && (
                                        <Button
                                            variant="link"
                                            className="mt-2"
                                            onClick={() => setShowAllMovements(true)}
                                        >
                                            Ver todos los movimientos
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="purchases">
                    {customerId && <CustomerSalesHistory customerId={customerId} />}
                </TabsContent>
            </Tabs>

            {/* Diálogo de Pago */}
            {
                customerId && (
                    <PaymentDialog
                        open={paymentDialogOpen}
                        onOpenChange={setPaymentDialogOpen}
                        customerId={customerId}
                        currentDebt={Number(account.balance)}
                    />
                )
            }

            {/* Diálogo de Detalle de Venta */}
            <SaleDetailDialog
                open={saleDetailOpen}
                onOpenChange={setSaleDetailOpen}
                saleId={selectedSaleId}
            />

            {/* Diálogo de Recargo */}
            {
                customerId && (
                    <ApplySurchargeDialog
                        open={surchargeDialogOpen}
                        onOpenChange={setSurchargeDialogOpen}
                        customerId={customerId}
                        currentBalance={Number(account.balance)}
                    />
                )
            }
        </div >
    );
}
