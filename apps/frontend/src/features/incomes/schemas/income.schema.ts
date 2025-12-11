/**
 * Schema de validación para formulario de ingreso
 */
import { z } from 'zod';

export const incomeSchema = z.object({
    description: z
        .string()
        .min(1, 'La descripción es requerida')
        .max(200, 'Máximo 200 caracteres'),
    amount: z
        .number({ invalid_type_error: 'El monto debe ser un número' })
        .min(0.01, 'El monto debe ser mayor a 0'),
    incomeDate: z.string().min(1, 'La fecha es requerida'),
    categoryId: z.string().optional(),
    customerId: z.string().optional(),
    customerName: z.string().max(200).optional(),
    isOnAccount: z.boolean().default(false),
    paymentMethodId: z.string().optional(),
    receiptNumber: z.string().max(100).optional(),
    isPaid: z.boolean().default(true),
    notes: z.string().max(1000).optional(),
}).refine(
    (data) => {
        // Si es a cuenta corriente, debe tener cliente
        if (data.isOnAccount && !data.customerId) {
            return false;
        }
        return true;
    },
    {
        message: 'Para ingresos a cuenta corriente debe seleccionar un cliente',
        path: ['customerId'],
    }
).refine(
    (data) => {
        // Si NO es a cuenta corriente, debe tener método de pago
        if (!data.isOnAccount && !data.paymentMethodId) {
            return false;
        }
        return true;
    },
    {
        message: 'Debe seleccionar un método de pago',
        path: ['paymentMethodId'],
    }
);

export type IncomeFormValues = z.infer<typeof incomeSchema>;
