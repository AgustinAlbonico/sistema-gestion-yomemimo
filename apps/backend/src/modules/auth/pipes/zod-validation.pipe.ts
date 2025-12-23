import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: ZodSchema) { }

    transform(value: unknown) {
        try {
            return this.schema.parse(value);
        } catch (error: any) {
            throw new BadRequestException({
                message: 'Validation failed',
                errors: error.errors,
            });
        }
    }
}
