/**
 * Tests de ZodValidationPipe
 * Prueba la validación de schemas Zod en pipes de NestJS
 */

import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

describe('ZodValidationPipe', () => {
    const TestSchema = z.object({
        name: z.string().min(1, 'El nombre es requerido'),
        age: z.number().int().positive('La edad debe ser un positivo'),
        email: z.string().email('Email inválido').optional(),
    });

    let pipe: ZodValidationPipe;

    beforeEach(() => {
        pipe = new ZodValidationPipe(TestSchema);
    });

    describe('transform - validación exitosa', () => {
        it('debería retornar el valor cuando pasa la validación', () => {
            const input = {
                name: 'Juan Pérez',
                age: 30,
            };

            const result = pipe.transform(input);

            expect(result).toEqual(input);
        });

        it('debería retornar el valor con campos opcionales', () => {
            const input = {
                name: 'María García',
                age: 25,
                email: 'maria@example.com',
            };

            const result = pipe.transform(input);

            expect(result).toEqual(input);
        });

        it('debería retornar el valor sin campos opcionales', () => {
            const input = {
                name: 'Carlos López',
                age: 40,
            };

            const result = pipe.transform(input);

            expect(result).toEqual(input);
            expect(result.email).toBeUndefined();
        });

        it('debería aceptar valores con tipos correctos', () => {
            const input = {
                name: 'Test User',
                age: 28,
                email: 'test@example.com',
            };

            const result = pipe.transform(input);

            expect(typeof result.name).toBe('string');
            expect(typeof result.age).toBe('number');
            expect(typeof result.email).toBe('string');
        });

        it('debería aceptar valores transformados por Zod', () => {
            const TransformSchema = z.object({
                value: z.string().transform((val) => val.toUpperCase()),
            });

            const transformPipe = new ZodValidationPipe(TransformSchema);
            const input = { value: 'hola' };

            const result = transformPipe.transform(input);

            expect(result.value).toBe('HOLA');
        });
    });

    describe('transform - validación fallida', () => {
        it('debería lanzar BadRequestException para datos inválidos', () => {
            const input = {
                name: '', // Nombre vacío es inválido
                age: 30,
            };

            expect(() => pipe.transform(input)).toThrow(BadRequestException);
        });

        it('debería incluir mensaje de validación en el error', () => {
            const input = {
                name: '',
                age: 30,
            };

            try {
                pipe.transform(input);
                fail('Debería haber lanzado BadRequestException');
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect((error as BadRequestException).message).toMatch(/Validation failed/i);
            }
        });

        it('debería incluir detalles de errores de Zod', () => {
            const input = {
                name: '',
                age: -5, // Edad negativa es inválida
            };

            try {
                pipe.transform(input);
                fail('Debería haber lanzado BadRequestException');
            } catch (error) {
                const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
                expect(response).toHaveProperty('message', 'Validation failed');
                expect(response).toHaveProperty('errors');
                expect(Array.isArray(response.errors)).toBe(true);
            }
        });

        it('debería validar campos requeridos faltantes', () => {
            const input = {
                name: 'Juan',
                // age falta
            };

            expect(() => pipe.transform(input)).toThrow(BadRequestException);
        });

        it('debería validar tipos de datos incorrectos', () => {
            const input = {
                name: 'Juan',
                age: 'treinta', // Debería ser número
            };

            expect(() => pipe.transform(input)).toThrow(BadRequestException);
        });

        it('debería validar formato de email', () => {
            const input = {
                name: 'Juan',
                age: 30,
                email: 'email-invalido',
            };

            expect(() => pipe.transform(input)).toThrow(BadRequestException);
        });

        it('debería incluir mensajes de error personalizados de Zod', () => {
            const input = {
                name: '',
                age: 30,
            };

            try {
                pipe.transform(input);
                fail('Debería haber lanzado BadRequestException');
            } catch (error) {
                const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
                const errors = response.errors as Array<{ message: string }>;

                expect(errors).toBeDefined();
                expect(
                    errors.some((e) => e.message.includes('nombre') || e.message.includes('required'))
                ).toBe(true);
            }
        });
    });

    describe('constructor', () => {
        it('debería almacenar el schema proporcionado', () => {
            const CustomSchema = z.object({ field: z.string() });
            const customPipe = new ZodValidationPipe(CustomSchema);

            const input = { field: 'value' };
            const result = customPipe.transform(input);

            expect(result).toEqual(input);
        });

        it('debería aceptar cualquier schema Zod válido', () => {
            const StringSchema = z.string();
            const stringPipe = new ZodValidationPipe(StringSchema);

            const result = stringPipe.transform('test string');

            expect(result).toBe('test string');
        });

        it('debería aceptar schemas de arrays', () => {
            const ArraySchema = z.array(z.number());
            const arrayPipe = new ZodValidationPipe(ArraySchema);

            const result = arrayPipe.transform([1, 2, 3, 4, 5]);

            expect(result).toEqual([1, 2, 3, 4, 5]);
        });
    });

    describe('error handling', () => {
        it('debería manejar objetos con propiedades extra', () => {
            const input = {
                name: 'Juan',
                age: 30,
                extraProp: 'no está en el schema',
            };

            const result = pipe.transform(input);

            // Zod por defecto permite propiedades extra
            expect(result).toHaveProperty('name', 'Juan');
            expect(result).toHaveProperty('age', 30);
        });

        it('debería rechazar valores null', () => {
            expect(() => pipe.transform(null)).toThrow(BadRequestException);
        });

        it('debería rechazar valores undefined', () => {
            expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
        });

        it('debería rechazar arrays cuando se espera objeto', () => {
            expect(() => pipe.transform([{ name: 'test' }])).toThrow(BadRequestException);
        });
    });
});
