/**
 * Página de configuración fiscal AFIP
 */
import { FiscalConfigForm } from '@/features/configuration';

export default function FiscalConfigPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración Fiscal</h1>
                <p className="text-muted-foreground">
                    Configure los datos del emisor y certificados AFIP para facturación electrónica
                </p>
            </div>

            <FiscalConfigForm />
        </div>
    );
}

