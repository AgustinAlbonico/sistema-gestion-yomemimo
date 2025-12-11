/**
 * Schemas de validación para formularios de clientes
 */
import { z } from 'zod';
import { IvaCondition } from '@/types/iva-condition';

const ivaConditionValues = Object.values(IvaCondition) as [string, ...string[]];

export const CustomerSchema = z.object({
    firstName: z.string().min(1, 'El nombre es requerido').max(100),
    lastName: z.string().min(1, 'El apellido es requerido').max(100),
    documentType: z.enum(['DNI', 'CUIT', 'CUIL', 'PASAPORTE', 'OTRO']).nullable().optional(),
    ivaCondition: z.nativeEnum(IvaCondition).default(IvaCondition.CONSUMIDOR_FINAL),
    documentNumber: z.string().max(50).nullable().optional().or(z.literal('')),
    email: z.string().email('Email inválido').nullable().optional().or(z.literal('')),
    phone: z.string().max(20).nullable().optional().or(z.literal('')),
    mobile: z.string().max(20).nullable().optional().or(z.literal('')),
    address: z.string().max(255).nullable().optional().or(z.literal('')),
    city: z.string().max(100).nullable().optional().or(z.literal('')),
    state: z.string().max(100).nullable().optional().or(z.literal('')),
    postalCode: z.string().max(20).nullable().optional().or(z.literal('')),
    categoryId: z.string().uuid().nullable().optional().or(z.literal('')),
    notes: z.string().max(5000).nullable().optional().or(z.literal('')),
    isActive: z.boolean().default(true),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;

export const CustomerCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional().or(z.literal('')),
    isActive: z.boolean().default(true),
});

export type CustomerCategoryFormValues = z.infer<typeof CustomerCategorySchema>;

