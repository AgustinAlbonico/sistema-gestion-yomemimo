import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { CommandPalette } from './CommandPalette';

interface KeyboardShortcutsProviderProps {
    readonly children: React.ReactNode;
}

/**
 * Provider de atajos de teclado.
 * Debe colocarse dentro del BrowserRouter para que useNavigate funcione.
 * Incluye el hook global de atajos y la paleta de comandos (Command Palette).
 */
export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
    // Hook que escucha teclas globalmente
    useKeyboardShortcuts();

    return (
        <>
            {children}
            {/* Paleta de comandos (Ctrl+B) */}
            <CommandPalette />
        </>
    );
}
