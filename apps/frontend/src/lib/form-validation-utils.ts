/**
 * Utilidades compartidas para validación de formularios
 * Reduce duplicación de lógica de validación
 */
import { z } from 'zod';

/**
 * Validación común para campos de monto
 */
export const amountValidation = z
    .number({ required_error: 'El monto es requerido' })
    .positive('El monto debe ser mayor a 0')
    .max(999999999, 'El monto es demasiado grande');

/**
 * Validación común para descripciones
 */
export const descriptionValidation = z
    .string({ required_error: 'La descripción es requerida' })
    .min(1, 'La descripción es requerida')
    .max(200, 'La descripción no puede exceder 200 caracteres');

/**
 * Validación común para notas opcionales
 */
export const notesValidation = z
    .string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional();

/**
 * Validación común para fechas
 */
export const dateValidation = z.string({ required_error: 'La fecha es requerida' });

/**
 * Validación común para método de pago
 */
export const paymentMethodValidation = z.string().optional();

/**
 * Validación común para método de pago requerido
 */
export const paymentMethodRequiredValidation = z
    .string({ required_error: 'El método de pago es requerido' })
    .min(1, 'El método de pago es requerido');

/**
 * Validación común para número de comprobante
 */
export const receiptNumberValidation = z
    .string()
    .max(50, 'El número de comprobante no puede exceder 50 caracteres')
    .optional();

/**
 * Validación común para estado de pago
 */
export const isPaidValidation = z.boolean().default(true);

/**
 * Valida que un método de pago esté presente si isPaid es true
 */
export function validatePaymentMethodIfPaid(data: { isPaid?: boolean; paymentMethodId?: string }) {
    if (data.isPaid && !data.paymentMethodId) {
        return {
            valid: false,
            error: 'El método de pago es requerido cuando está marcado como pagado',
        };
    }
    return { valid: true };
}

/**
 * Valida que el monto sea positivo
 */
export function validatePositiveAmount(amount: number): boolean {
    return amount > 0;
}

/**
 * Formatea errores de validación para mostrar al usuario
 */
export function formatValidationError(error: z.ZodError): string {
    return error.errors.map((err) => err.message).join(', ');
}

