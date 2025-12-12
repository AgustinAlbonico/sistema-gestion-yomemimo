/**
 * Utilidades compartidas para manejo de pagos
 * Reduce duplicación de lógica en servicios de gastos e ingresos
 */

/**
 * Determina si un registro debe considerarse como pagado
 * @param isPaid - Valor explícito de isPaid (puede ser undefined)
 * @returns true si está pagado, false si no
 */
export function resolveIsPaidStatus(isPaid: boolean | undefined): boolean {
    return isPaid ?? true;
}

/**
 * Valida que exista un método de pago si el registro está marcado como pagado
 * @param isPaid - Si el registro está pagado
 * @param paymentMethodId - ID del método de pago
 * @returns Objeto con validación y mensaje de error si aplica
 */
export function validatePaymentMethod(
    isPaid: boolean,
    paymentMethodId: string | undefined
): { isValid: boolean; error?: string } {
    if (isPaid && !paymentMethodId) {
        return {
            isValid: false,
            error: 'El método de pago es requerido cuando el registro está marcado como pagado',
        };
    }
    return { isValid: true };
}

/**
 * Determina la fecha de pago basándose en el estado y las fechas proporcionadas
 * @param isPaid - Si el registro está pagado
 * @param paidAt - Fecha de pago explícita (opcional)
 * @param defaultDate - Fecha por defecto si no se proporciona paidAt
 * @returns Fecha de pago o null si no está pagado
 */
export function resolvePaidDate(
    isPaid: boolean,
    paidAt: Date | undefined,
    defaultDate: Date
): Date | null {
    if (!isPaid) {
        return null;
    }
    return paidAt ?? defaultDate;
}

/**
 * Interfaz para datos de movimiento de caja
 */
export interface CashMovementData {
    amount: number;
    description: string;
    paymentMethodId: string;
    notes?: string;
}

/**
 * Crea los datos para registrar un movimiento en caja
 * @param type - Tipo de movimiento ('expense' | 'income')
 * @param entityId - ID de la entidad relacionada (gasto o ingreso)
 * @param amount - Monto del movimiento
 * @param description - Descripción del movimiento
 * @param paymentMethodId - ID del método de pago
 * @param notes - Notas adicionales (opcional)
 * @returns Datos formateados para el registro en caja
 */
export function createCashMovementData(
    type: 'expense' | 'income',
    entityId: string,
    amount: number,
    description: string,
    paymentMethodId: string,
    notes?: string
): { expenseId?: string; incomeId?: string } & CashMovementData {
    const baseData: CashMovementData = {
        amount,
        description,
        paymentMethodId,
        notes,
    };

    if (type === 'expense') {
        return { ...baseData, expenseId: entityId };
    } else {
        return { ...baseData, incomeId: entityId };
    }
}

/**
 * Maneja errores de registro en caja de forma consistente
 * @param error - Error capturado
 * @param context - Contexto del error (para logging)
 * @returns Mensaje de error formateado
 */
export function handleCashRegisterError(error: unknown, context: string): string {
    console.error(`[${context}] ERROR al registrar en caja:`, error);
    
    if (error instanceof Error) {
        return error.message;
    }
    
    return 'Error desconocido al registrar en caja';
}

