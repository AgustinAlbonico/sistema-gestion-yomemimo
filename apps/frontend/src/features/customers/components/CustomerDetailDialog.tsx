
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    User,
    Tag,
    CheckCircle2,
    XCircle,
    Receipt,
    CreditCard,
    Phone,
    Mail,
    MapPin,
    FileText,
    Calendar,
    ShoppingCart,
    DollarSign,
    Eye,
    Loader2
} from 'lucide-react';

import { Customer } from '../types';
import { IvaConditionLabels } from '@/types/iva-condition';
import { salesApi } from '@/features/sales/api/sales.api';
import { incomesApi } from '@/features/incomes/api/incomes.api';
import { SaleDetail } from '@/features/sales/components/SaleDetail';
import { SaleStatus } from '@/features/sales/types';

interface CustomerDetailDialogProps {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
}

export function CustomerDetailDialog({
    customer,
    open,
    onClose,
}: CustomerDetailDialogProps) {
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

    // Queries for history
    const { data: salesData, isLoading: isLoadingSales } = useQuery({
        queryKey: ['sales', { customerId: customer?.id }],
        queryFn: () => salesApi.getAll({ customerId: customer?.id, limit: 50 }),
        enabled: !!customer?.id && open,
    });

    const { data: incomesData, isLoading: isLoadingIncomes } = useQuery({
        queryKey: ['incomes', { customerId: customer?.id }],
        queryFn: () => incomesApi.getAll({ customerId: customer?.id, limit: 50 }),
        enabled: !!customer?.id && open,
    });

    if (!customer) return null;

    const fullName = `${customer.firstName} ${customer.lastName}`;
    const hasContactInfo = customer.email || customer.phone || customer.mobile;
    const hasAddressInfo = customer.address || customer.city || customer.state;

    const getStatusColor = (status: SaleStatus) => {
        switch (status) {
            case SaleStatus.COMPLETED: return 'bg-green-500/10 text-green-600 hover:bg-green-500/20';
            case SaleStatus.PENDING: return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20';
            case SaleStatus.CANCELLED: return 'bg-red-500/10 text-red-600 hover:bg-red-500/20';
            default: return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
        }
    };

    const getStatusLabel = (status: SaleStatus) => {
        switch (status) {
            case SaleStatus.COMPLETED: return 'Completada';
            case SaleStatus.PENDING: return 'Pendiente';
            case SaleStatus.CANCELLED: return 'Cancelada';
            default: return status;
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                {/* Ancho responsivo: 95% en móvil, 800px en desktop */}
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[700px] lg:max-w-[800px] p-0 gap-0 overflow-hidden h-[85vh] sm:h-[80vh] flex flex-col">
                    <DialogTitle className="sr-only">Detalle del Cliente {fullName}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Información detallada del cliente {fullName}, historial de compras y pagos.
                    </DialogDescription>
                    {/* Header con gradiente y nombre del cliente */}
                    <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-4 sm:px-6 py-4 sm:py-5 text-primary-foreground shrink-0">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm shrink-0">
                                <User className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                                    {fullName}
                                </h2>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
                                    {customer.category ? (
                                        <Badge
                                            variant="secondary"
                                            className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs"
                                        >
                                            <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 opacity-80" />
                                            {customer.category.name}
                                        </Badge>
                                    ) : null}
                                    <Badge
                                        variant="secondary"
                                        className={`text-xs ${customer.isActive
                                            ? "bg-green-500/30 text-white border-green-400/50"
                                            : "bg-white/20 text-white/70 border-white/30"
                                            }`}
                                    >
                                        {customer.isActive ? (
                                            <><CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> Activo</>
                                        ) : (
                                            <><XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> Inactivo</>
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                        {/* Tabs con scroll horizontal en móvil */}
                        <div className="px-3 sm:px-6 pt-2 border-b shrink-0 bg-background overflow-x-auto">
                            <TabsList className="w-full sm:w-auto justify-start h-10 sm:h-12 bg-transparent p-0 gap-1 sm:gap-4 min-w-max">
                                <TabsTrigger
                                    value="info"
                                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-8 sm:h-10 px-2 sm:px-4 rounded-md border border-transparent data-[state=active]:border-primary/20 text-xs sm:text-sm"
                                >
                                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden xs:inline">Información</span>
                                    <span className="xs:hidden">Info</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="purchases"
                                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-8 sm:h-10 px-2 sm:px-4 rounded-md border border-transparent data-[state=active]:border-primary/20 text-xs sm:text-sm"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Historial de Compras</span>
                                    <span className="sm:hidden">Compras</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="incomes"
                                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-8 sm:h-10 px-2 sm:px-4 rounded-md border border-transparent data-[state=active]:border-primary/20 text-xs sm:text-sm"
                                >
                                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Historial de Pagos</span>
                                    <span className="sm:hidden">Pagos</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Contenido principal scrolleable */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
                            <TabsContent value="info" className="p-6 m-0 space-y-5 h-full">
                                {/* Información fiscal */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Información Fiscal
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Documento */}
                                        <div className="rounded-lg bg-background p-3 border shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <CreditCard className="h-3 w-3 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">Documento</p>
                                            </div>
                                            {customer.documentNumber ? (
                                                <p className="text-sm font-semibold">
                                                    {customer.documentType}: {customer.documentNumber}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No especificado</p>
                                            )}
                                        </div>

                                        {/* Condición IVA */}
                                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Condición IVA</p>
                                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                {customer.ivaCondition
                                                    ? IvaConditionLabels[customer.ivaCondition]
                                                    : 'No especificada'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Información de contacto */}
                                {hasContactInfo ? (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Contacto
                                                </span>
                                            </div>

                                            <div className="rounded-xl bg-background p-4 border shadow-sm space-y-3">
                                                {customer.email ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-primary/10 rounded-lg">
                                                            <Mail className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <a
                                                            href={`mailto:${customer.email}`}
                                                            className="text-sm text-primary hover:underline font-medium"
                                                        >
                                                            {customer.email}
                                                        </a>
                                                    </div>
                                                ) : null}

                                                {(customer.phone || customer.mobile) ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                            <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {customer.phone}
                                                            {customer.phone && customer.mobile && ' / '}
                                                            {customer.mobile}
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                {/* Dirección */}
                                {hasAddressInfo ? (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Ubicación
                                                </span>
                                            </div>

                                            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 border border-amber-200 dark:border-amber-800/50 shadow-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-amber-500/20 rounded-lg">
                                                        <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <div>
                                                        {customer.address ? (
                                                            <p className="text-sm font-medium">{customer.address}</p>
                                                        ) : null}
                                                        <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                                                            {[customer.city, customer.state, customer.postalCode]
                                                                .filter(Boolean)
                                                                .join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                {/* Notas */}
                                {customer.notes ? (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Notas
                                                </span>
                                            </div>

                                            <div className="rounded-xl bg-background p-4 border shadow-sm">
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {customer.notes}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                {/* Fecha de creación */}
                                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                        Cliente desde{' '}
                                        {new Date(customer.createdAt).toLocaleDateString('es-AR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </TabsContent>

                            <TabsContent value="purchases" className="p-6 m-0 h-full">
                                {isLoadingSales ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : salesData?.data.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-60 text-muted-foreground bg-background rounded-lg border border-dashed">
                                        <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                                        <p>No hay compras registradas</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border bg-background overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>N° Venta</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                    <TableHead className="text-center">Estado</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {salesData?.data.map((sale) => (
                                                    <TableRow key={sale.id}>
                                                        <TableCell>
                                                            {new Date(sale.saleDate).toLocaleDateString('es-AR')}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">
                                                            {sale.saleNumber}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ${Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge className={getStatusColor(sale.status)} variant="outline">
                                                                {getStatusLabel(sale.status)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedSaleId(sale.id)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="incomes" className="p-6 m-0 h-full">
                                {isLoadingIncomes ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : incomesData?.data.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-60 text-muted-foreground bg-background rounded-lg border border-dashed">
                                        <DollarSign className="h-10 w-10 mb-2 opacity-20" />
                                        <p>No hay ingresos registrados</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border bg-background overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Descripción</TableHead>
                                                    <TableHead className="text-right">Monto</TableHead>
                                                    <TableHead className="text-center">Estado</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {incomesData?.data.map((income) => (
                                                    <TableRow key={income.id}>
                                                        <TableCell>
                                                            {new Date(income.incomeDate).toLocaleDateString('es-AR')}
                                                        </TableCell>
                                                        <TableCell>
                                                            {income.description}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ${Number(income.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                variant={income.isPaid ? 'default' : 'secondary'}
                                                                className={income.isPaid ? 'bg-green-500 hover:bg-green-600' : ''}
                                                            >
                                                                {income.isPaid ? 'Cobrado' : 'Pendiente'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Modal de detalle de venta */}
            {selectedSaleId && (
                <SaleDetail
                    saleId={selectedSaleId}
                    open={!!selectedSaleId}
                    onClose={() => setSelectedSaleId(null)}
                />
            )}
        </>
    );
}
