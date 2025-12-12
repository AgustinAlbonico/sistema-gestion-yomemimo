/**
 * Utilidades para manejo de fechas en el backend
 * Previene problemas de zona horaria parseando fechas como locales
 */

/**
 * Parsea un string de fecha/hora a Date usando zona horaria local
 * - Si viene solo fecha (YYYY-MM-DD), usa la hora actual
 * - Si viene con hora (ISO 8601 completo), preserva la hora
 * 
 * @param dateString - String en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
 * @returns Objeto Date en zona horaria local
 * 
 * @example
 * parseLocalDate('2024-11-28') // Date con hora actual
 * parseLocalDate('2024-11-28T10:30:00') // Date con hora 10:30:00
 */
export function parseLocalDate(dateString: string): Date {
    // Si viene con hora/timestamp completo (contiene 'T')
    if (dateString.includes('T')) {
        // Parsear fecha con hora
        const date = new Date(dateString);
        // Si es válida, retornarla
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    // Si solo viene fecha (YYYY-MM-DD), crear fecha con hora actual
    const [year, month, day] = dateString.split('-').map(Number);
    const now = new Date();
    return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
}

/**
 * Formatea una fecha Date a formato YYYY-MM-DD usando zona horaria local
 * 
 * @param date - Objeto Date a formatear
 * @returns Fecha en formato YYYY-MM-DD
 */
export function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD usando zona horaria local
 * 
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getTodayLocal(): string {
    const now = new Date();
    return formatDateLocal(now);
}

/**
 * Valida si un string es una fecha válida en formato YYYY-MM-DD
 * 
 * @param dateString - String a validar
 * @returns true si es válido, false en caso contrario
 */
export function isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    try {
        const date = parseLocalDate(dateString);
        return date instanceof Date && !Number.isNaN(date.getTime());
    } catch {
        return false;
    }
}

/**
 * Obtiene el primer día del mes para una fecha dada
 * 
 * @param date - Fecha de referencia (default: hoy)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getFirstDayOfMonth(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    return formatDateLocal(new Date(year, month, 1));
}

/**
 * Obtiene el último día del mes para una fecha dada
 * 
 * @param date - Fecha de referencia (default: hoy)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getLastDayOfMonth(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    return formatDateLocal(new Date(year, month + 1, 0));
}

/**
 * Obtiene el rango del mes para una fecha dada
 * 
 * @param date - Fecha de referencia (default: hoy)
 * @returns Objeto con startDate y endDate en formato YYYY-MM-DD
 */
export function getMonthRange(date: Date = new Date()): {
    startDate: string;
    endDate: string;
} {
    return {
        startDate: getFirstDayOfMonth(date),
        endDate: getLastDayOfMonth(date),
    };
}

/**
 * Obtiene la fecha de hoy como objeto Date sin componente de hora
 * Útil para campos de tipo 'date' en TypeORM
 * 
 * @returns Objeto Date con solo año, mes y día (sin hora)
 */
export function getTodayLocalDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
