/**
 * Componente de alerta para notificar cuando hay una caja del día anterior sin cerrar.
 * Se muestra como un diálogo que requiere acción del usuario.
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
import { useCashStatus } from '../hooks';

interface UnclosedCashAlertDialogProps {
    /** Callback cuando el usuario decide continuar de todos modos */
    onContinue?: () => void;
}

export function UnclosedCashAlertDialog({ onContinue }: UnclosedCashAlertDialogProps) {
    const navigate = useNavigate();
    const { data: cashStatus, isLoading } = useCashStatus();

    // Solo mostrar si hay caja abierta del día anterior
    const showAlert = !isLoading && cashStatus?.hasOpenRegister && cashStatus?.isFromPreviousDay;

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
