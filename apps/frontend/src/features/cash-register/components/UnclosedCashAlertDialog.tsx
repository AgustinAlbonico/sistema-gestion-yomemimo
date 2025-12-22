/**
 * Componente de alerta para notificar cuando hay una caja del día anterior sin cerrar.
 * Se muestra como un diálogo que requiere acción del usuario.
 * Cuando se usa en modo embebido (embedded=true), se renderiza como un Card sin el portal del AlertDialog.
 */
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashStatus } from '../hooks';
import type { CashStatus } from '../types';

interface UnclosedCashAlertDialogProps {
    /** Callback cuando el usuario decide continuar de todos modos */
    readonly onContinue?: () => void;
    /** Si es true, renderiza como Card embebido en lugar de AlertDialog con portal */
    readonly embedded?: boolean;
    /** Estado de caja opcional (si se pasa, evita hacer fetch internamente) */
    readonly cashStatusData?: CashStatus;
}

export function UnclosedCashAlertDialog({ onContinue, embedded = false, cashStatusData }: UnclosedCashAlertDialogProps) {
    const navigate = useNavigate();
    const { data: fetchedCashStatus, isLoading } = useCashStatus();

    // Usar el cashStatus pasado como prop si existe, sino usar el del hook
    const cashStatus = cashStatusData ?? fetchedCashStatus;
    const isLoadingData = cashStatusData ? false : isLoading;

    // Solo mostrar si hay caja abierta del día anterior
    const showAlert = !isLoadingData && cashStatus?.hasOpenRegister && cashStatus?.isFromPreviousDay;

    if (!showAlert || !cashStatus?.openRegister) {
        return null;
    }

    const handleGoToCashRegister = () => {
        navigate('/cash-register');
    };

    const handleContinue = () => {
        if (onContinue) {
            onContinue();
        }
    };

    // Contenido compartido entre las dos variantes
    const alertContent = (
        <div className="space-y-4 text-base">
            <p>
                Hay una caja abierta del día{' '}
                <strong className="text-foreground">
                    {formatDate(cashStatus.openRegister.date)}
                </strong>{' '}
                que no fue cerrada.
            </p>
            <p className="text-sm text-muted-foreground">
                Abierta por:{' '}
                <span className="font-medium">
                    {cashStatus.openRegister.openedBy?.name || 'Usuario desconocido'}
                </span>
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <p className="text-amber-800 dark:text-amber-200">
                    <strong>Importante:</strong> Si continúas operando, los movimientos se
                    registrarán en la caja del día anterior. Se recomienda cerrar la caja
                    primero.
                </p>
            </div>
        </div>
    );

    // Variante embebida (sin portal, como Card)
    if (embedded) {
        return (
            <Card className="max-w-md border-amber-200 dark:border-amber-800 bg-card shadow-lg">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle className="text-xl">
                            Caja del día anterior sin cerrar
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {alertContent}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    {onContinue && (
                        <Button
                            variant="outline"
                            onClick={handleContinue}
                            className="text-muted-foreground w-full sm:w-auto"
                        >
                            Continuar de todos modos
                        </Button>
                    )}
                    <Button
                        onClick={handleGoToCashRegister}
                        className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                    >
                        Ir al módulo de Caja
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // Variante por defecto (AlertDialog con portal)
    return (
        <AlertDialog open={true}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <AlertDialogTitle className="text-xl">
                            Caja del día anterior sin cerrar
                        </AlertDialogTitle>
                    </div>
                </AlertDialogHeader>
                <AlertDialogDescription asChild>
                    {alertContent}
                </AlertDialogDescription>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    {onContinue && (
                        <Button
                            variant="outline"
                            onClick={handleContinue}
                            className="text-muted-foreground"
                        >
                            Continuar de todos modos
                        </Button>
                    )}
                    <AlertDialogAction onClick={handleGoToCashRegister} className="bg-amber-600 hover:bg-amber-700">
                        Ir al módulo de Caja
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
