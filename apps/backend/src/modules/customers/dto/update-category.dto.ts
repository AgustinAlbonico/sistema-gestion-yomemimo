/**
 * DTO para actualizar una categoría de clientes
 */
import { z } from 'zod';
import { PartialType } from '@nestjs/swagger';
import { CreateCustomerCategorySchema, CreateCustomerCategoryDto } from './create-category.dto';

export const UpdateCustomerCategorySchema = CreateCustomerCategorySchema.partial();

export type UpdateCustomerCategoryDTO = z.infer<typeof UpdateCustomerCategorySchema>;

export class UpdateCustomerCategoryDto extends PartialType(CreateCustomerCategoryDto) {}

