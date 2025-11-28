import { z } from 'zod';

/**
 * Esquema de validación simplificado para formulario de producto
 * - Nombre (requerido)
 * - Costo (requerido)
 * - Stock (requerido para carga inicial)
 * - Categoría (opcional)
 */
export const productSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    cost: z.coerce.number().min(0, 'El costo debe ser 0 o mayor'),
    stock: z.coerce.number().int().min(0, 'El stock debe ser 0 o mayor').default(0),
    categoryId: z.string().uuid().optional(),
    isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;
