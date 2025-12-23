import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(value);
}

export function formatDate(date: string | Date): string {
    let d: Date;

    if (typeof date === 'string') {
        // Si es un string con formato YYYY-MM-DD (sin hora), parsearlo como fecha local
        // para evitar problemas de zona horaria UTC
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-').map(Number);
            d = new Date(year, month - 1, day);
        } else {
            d = new Date(date);
        }
    } else {
        d = date;
    }

    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
}

export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

/**
 * Detecta si la aplicación está corriendo dentro de Electron
 */
export function isElectron(): boolean {
    return globalThis.window !== undefined &&
        (globalThis as unknown as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron === true;
}