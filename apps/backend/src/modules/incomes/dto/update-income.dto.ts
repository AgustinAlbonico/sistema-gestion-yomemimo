/**
 * DTO para actualizar un ingreso
 */
import { PartialType } from '@nestjs/swagger';
import { CreateIncomeDto } from './create-income.dto';

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) { }
