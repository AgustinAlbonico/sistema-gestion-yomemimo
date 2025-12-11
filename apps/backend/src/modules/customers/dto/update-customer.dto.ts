/**
 * DTO para actualizar un cliente existente
 * Todos los campos son opcionales
 */
import { z } from 'zod';
import { PartialType } from '@nestjs/swagger';
import { CreateCustomerSchema, CreateCustomerDto } from './create-customer.dto';

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export type UpdateCustomerDTO = z.infer<typeof UpdateCustomerSchema>;

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

