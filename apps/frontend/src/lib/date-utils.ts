/**
 * Utilidades para manejo de fechas
 * Previene problemas de zona horaria usando siempre fechas locales
 */

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD usando zona horaria local
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getTodayLocal(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha Date a formato YYYY-MM-DD usando zona horaria local
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
 * Parsea un string YYYY-MM-DD a Date usando zona horaria local
 * Evita problemas de zona horaria que ocurren con new Date('YYYY-MM-DD')
 * @param dateString - String en formato YYYY-MM-DD
 * @returns Objeto Date en zona horaria local
 */
export function parseLocalDate(dateString: string): Date {
    // Si viene con hora, solo tomamos la parte de la fecha
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Obtiene el primer día del mes actual
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getFirstDayOfMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return formatDateLocal(new Date(year, month, 1));
}

/**
 * Obtiene el último día del mes actual
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getLastDayOfMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return formatDateLocal(new Date(year, month + 1, 0));
}

/**
 * Obtiene el rango del mes actual (primer y último día)
 * @returns Objeto con startDate y endDate en formato YYYY-MM-DD
 */
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
    return {
        startDate: getFirstDayOfMonth(),
        endDate: getLastDayOfMonth(),
    };
}

/**
 * Obtiene el rango de la semana actual (domingo a sábado)
 * @returns Objeto con startDate y endDate en formato YYYY-MM-DD
 */
export function getCurrentWeekRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 6);
    
    return {
        startDate: formatDateLocal(startDate),
        endDate: formatDateLocal(endDate),
    };
}

/**
 * Obtiene el rango de hoy (misma fecha para inicio y fin)
 * @returns Objeto con startDate y endDate en formato YYYY-MM-DD
 */
export function getTodayRange(): { startDate: string; endDate: string } {
    const today = getTodayLocal();
    return { startDate: today, endDate: today };
}

/**
 * Formatea una fecha para mostrar en la UI (formato corto)
 * @param dateString - String en formato YYYY-MM-DD o ISO
 * @param format - Formato deseado: 'short' (dd/MM/yyyy) o 'long' (dd de MMMM, yyyy)
 * @returns Fecha formateada
 */
export function formatDateForDisplay(
    dateString: string,
    format: 'short' | 'long' = 'short'
): string {
    const date = parseLocalDate(dateString);
    
    if (format === 'long') {
        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }
    
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Formatea una fecha con hora para mostrar en la UI
 * @param dateString - String en formato ISO o YYYY-MM-DD
 * @returns Fecha y hora formateada (dd/MM/yyyy HH:mm)
 */
export function formatDateTimeForDisplay(dateString: string): string {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        return dateString;
    }
    
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Valida si una fecha está en formato YYYY-MM-DD válido
 * @param dateString - String a validar
 * @returns true si es válido, false en caso contrario
 */
export function isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = parseLocalDate(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

