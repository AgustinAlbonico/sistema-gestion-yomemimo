import { ShieldOff, Phone } from 'lucide-react';

/**
 * Pantalla de bloqueo cuando el sistema está deshabilitado
 * Se muestra cuando sistemaHabilitado = false en la configuración
 */
export function SystemBlockedScreen() {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
                {/* Icono */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldOff className="w-8 h-8 text-red-600" />
                </div>

                {/* Título */}
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Sistema Deshabilitado
                </h1>

                {/* Mensaje */}
                <p className="text-gray-600 mb-6">
                    Contactarse con el administrador
                </p>

                {/* Teléfono */}
                <a
                    href="tel:3471504576"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                    <Phone className="w-5 h-5" />
                    <span>3471504576</span>
                </a>
            </div>
        </div>
    );
}

