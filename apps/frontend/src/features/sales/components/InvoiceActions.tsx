/**
 * Componente para acciones de facturación fiscal
 * Muestra el estado de la factura y permite generar/descargar PDF
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Download,
    RefreshCw,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock,
} from 'lucide-react';
import { invoicesApi } from '../api/sales.api';
import {
    Sale,
    Invoice,
    InvoiceStatus,
    InvoiceStatusLabels,
    InvoiceStatusColors,
    InvoiceTypeLabels,
    SaleStatus,
} from '../types';
import { api } from '@/lib/axios';

interface InvoiceActionsProps {
    readonly sale: Sale;
    readonly invoice?: Invoice;
}

export function InvoiceActions({ sale, invoice: initialInvoice }: InvoiceActionsProps) {
    const queryClient = useQueryClient();
    const [isDownloading, setIsDownloading] = useState(false);
    // Estado local para la factura (permite actualizar después de retry)
    const [invoice, setInvoice] = useState<Invoice | undefined>(initialInvoice);

    /**
     * Mutación para generar factura
     */
    const generateMutation = useMutation({
        mutationFn: () => invoicesApi.generate(sale.id),
        onSuccess: (data) => {
            if (data.status === InvoiceStatus.AUTHORIZED) {
                toast.success('Factura generada correctamente', {
                    description: `CAE: ${data.cae}`,
                });
            } else if (data.status === InvoiceStatus.REJECTED) {
                toast.error('Factura rechazada por AFIP', {
                    description: data.afipErrorMessage,
                });
            } else {
                toast.warning('Factura pendiente de autorización');
            }
            // Actualizar estado local
            setInvoice(data);
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales', sale.id] });
        },
        onError: (error: Error) => {
            toast.error('Error al generar factura', {
                description: error.message,
            });
        },
    });

    /**
     * Mutación para reintentar autorización
     */
    const retryMutation = useMutation({
        mutationFn: () => {
            if (!invoice) throw new Error('No hay factura');
            return invoicesApi.retry(invoice.id);
        },
        onSuccess: (data) => {
            if (data.status === InvoiceStatus.AUTHORIZED) {
                toast.success('Factura autorizada correctamente', {
                    description: `CAE: ${data.cae}`,
                });
            } else {
                toast.error('La factura sigue sin autorizarse', {
                    description: data.afipErrorMessage,
                });
            }
            // Actualizar estado local con la nueva factura
            setInvoice(data);
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales', sale.id] });
        },
        onError: (error: Error) => {
            toast.error('Error al reintentar', {
                description: error.message,
            });
        },
    });

    /**
     * Descarga el PDF de la factura
     */
    const handleDownloadPdf = async () => {
        if (!invoice?.id) return;
        
        try {
            setIsDownloading(true);
            
            const response = await api.get(`/api/invoices/${invoice.id}/pdf`, {
                responseType: 'blob',
            });

            // Crear URL del blob
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Crear link y descargar
            const link = document.createElement('a');
            link.href = url;
            link.download = `factura-${String(invoice.pointOfSale).padStart(4, '0')}-${String(invoice.invoiceNumber).padStart(8, '0')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpiar
            window.URL.revokeObjectURL(url);
            toast.success('PDF descargado');
        } catch (error) {
            toast.error('Error al descargar PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    /**
     * Descarga el PDF de la nota de venta (no fiscal)
     */
    const handleDownloadSaleNote = async () => {
        try {
            setIsDownloading(true);
            
            const response = await api.get(invoicesApi.getSaleNotePdfUrl(sale.id), {
                responseType: 'blob',
            });

            // Crear URL del blob
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Crear link y descargar
            const link = document.createElement('a');
            link.href = url;
            link.download = `nota-venta-${sale.saleNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpiar
            window.URL.revokeObjectURL(url);
            toast.success('Nota de venta descargada');
        } catch (error) {
            toast.error('Error al descargar nota de venta');
        } finally {
            setIsDownloading(false);
        }
    };

    /**
     * Si la venta está cancelada, no se puede facturar
     */
    if (sale.status === SaleStatus.CANCELLED) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Venta cancelada - No se puede facturar</span>
            </div>
        );
    }

    /**
     * Si no hay factura, mostrar botón para generar
     * Si hay factura pendiente (fiscalPending), mostrar mensaje de error y botón para reintentar
     */
    if (!invoice) {
        // Caso: Se solicitó factura pero falló la generación
        if (sale.fiscalPending) {
            return (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <div>
                            <p className="font-medium text-orange-700 dark:text-orange-300">
                                Factura fiscal pendiente
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Se intentó generar la factura pero ocurrió un error
                            </p>
                        </div>
                    </div>
                    
                    {sale.fiscalError && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-700 dark:text-orange-300">
                            <p className="font-medium">Error:</p>
                            <p>{sale.fiscalError}</p>
                        </div>
                    )}
                    
                    <Button
                        size="sm"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Reintentar Facturación
                    </Button>
                </div>
            );
        }

        // Caso normal: Sin factura solicitada
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Sin factura fiscal</span>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <FileText className="h-4 w-4 mr-2" />
                        )}
                        Generar Factura
                    </Button>
                </div>
                <div className="pt-2 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadSaleNote}
                        disabled={isDownloading}
                        className="w-full"
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Descargar Nota de Venta (No Fiscal)
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Mostrar información de la factura existente
     */
    return (
        <div className="space-y-4">
            {/* Header con estado */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {invoice.status === InvoiceStatus.AUTHORIZED && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {invoice.status === InvoiceStatus.PENDING && (
                        <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    {(invoice.status === InvoiceStatus.REJECTED ||
                        invoice.status === InvoiceStatus.ERROR) && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                        <p className="font-medium">
                            {InvoiceTypeLabels[invoice.invoiceType]}
                        </p>
                        {invoice.invoiceNumber && (
                            <p className="text-sm text-muted-foreground">
                                {String(invoice.pointOfSale).padStart(4, '0')}-
                                {String(invoice.invoiceNumber).padStart(8, '0')}
                            </p>
                        )}
                    </div>
                </div>
                <Badge className={InvoiceStatusColors[invoice.status]}>
                    {InvoiceStatusLabels[invoice.status]}
                </Badge>
            </div>

            {/* CAE Info */}
            {invoice.cae && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">CAE</p>
                        <p className="font-mono">{invoice.cae}</p>
                    </div>
                    {invoice.caeExpirationDate && (
                        <div>
                            <p className="text-muted-foreground">Vencimiento CAE</p>
                            <p>
                                {new Date(invoice.caeExpirationDate).toLocaleDateString('es-AR')}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Error message */}
            {invoice.afipErrorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
                    <p className="font-medium">Error AFIP:</p>
                    <p>{invoice.afipErrorMessage}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {invoice.status === InvoiceStatus.AUTHORIZED && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Descargar PDF
                    </Button>
                )}
                
                {(invoice.status === InvoiceStatus.REJECTED ||
                    invoice.status === InvoiceStatus.ERROR) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryMutation.mutate()}
                        disabled={retryMutation.isPending}
                    >
                        {retryMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Reintentar
                    </Button>
                )}
            </div>
        </div>
    );
}
