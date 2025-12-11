/**
 * Esquemas de validación para formularios de gastos
 */
import { z } from 'zod';
import { PaymentMethod } from '../types';

/**
 * Esquema para crear/editar un gasto
 */
export const expenseSchema = z.object({
    description: z
        .string()
        .min(1, 'La descripción es requerida')
        .max(200, 'Máximo 200 caracteres'),
    amount: z.coerce
        .number()
        .positive('El monto debe ser mayor a 0'),
    expenseDate: z
        .string()
        .min(1, 'La fecha es requerida'),
    categoryId: z
        .string()
        .uuid('Seleccione una categoría válida')
        .optional(),
    paymentMethodId: z
        .string()
        .uuid('Seleccione un método de pago válido')
        .optional(),
    receiptNumber: z
        .string()
        .max(100)
        .optional(),
    isPaid: z
        .boolean()
        .default(true),
    notes: z
        .string()
        .max(1000)
        .optional(),
}).superRefine((data, ctx) => {
    if (data.isPaid && !data.paymentMethodId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El método de pago es requerido cuando el gasto está pagado',
            path: ['paymentMethodId'],
        });
    }
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

/**
 * Esquema para crear/editar una categoría de gasto
 */
export const expenseCategorySchema = z.object({
    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .max(100, 'Máximo 100 caracteres'),
    description: z
        .string()
        .max(500)
        .optional(),
    isRecurring: z
        .boolean()
        .default(false),
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;

