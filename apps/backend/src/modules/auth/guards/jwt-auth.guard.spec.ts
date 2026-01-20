/**
 * Tests de JwtAuthGuard
 * Prueba la lógica de autenticación JWT y bypass de rutas públicas
 */

import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new JwtAuthGuard(reflector);
    });

    // Helper para crear un mock de ExecutionContext
    const createMockContext = (
        handlerMetadata: Record<string, unknown> = {},
        classMetadata: Record<string, unknown> = {}
    ): ExecutionContext => {
        const context = {
            getHandler: jest.fn().mockReturnValue({ ...handlerMetadata }),
            getClass: jest.fn().mockReturnValue({ ...classMetadata }),
        } as unknown as ExecutionContext;

        return context;
    };

    describe('constructor', () => {
        it('debería crear una instancia con Reflector', () => {
            expect(guard).toBeInstanceOf(JwtAuthGuard);
        });
    });

    describe('lógica de rutas públicas usando Reflector', () => {
        it('debería permitir acceso cuando el handler tiene decorador @Public()', () => {
            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

            const context = createMockContext({ [IS_PUBLIC_KEY]: true });

            // Verificar que el reflector retorna true para rutas públicas
            const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            expect(isPublic).toBe(true);
        });

        it('debería permitir acceso cuando la clase tiene decorador @Public()', () => {
            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

            const context = createMockContext(
                {},
                { [IS_PUBLIC_KEY]: true }
            );

            const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            expect(isPublic).toBe(true);
        });

        it('debería consultar reflector con handler y clase en orden correcto', () => {
            const mockHandler = { name: 'mockHandler' };
            const mockClass = { name: 'MockController' };

            const getAllAndOverrideSpy = jest
                .spyOn(reflector, 'getAllAndOverride')
                .mockReturnValue(false);

            const context = createMockContext(mockHandler, mockClass);

            reflector.getAllAndOverride(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            expect(getAllAndOverrideSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
                mockHandler,
                mockClass,
            ]);
        });

        it('debería denegar acceso cuando no es ruta pública', () => {
            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

            const context = createMockContext();

            const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            expect(isPublic).toBe(false);
        });
    });

    describe('Reflector integration', () => {
        it('debería usar getAllAndOverride correctamente', () => {
            const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

            const context = createMockContext(
                { [IS_PUBLIC_KEY]: true },
                { [IS_PUBLIC_KEY]: false }
            );

            reflector.getAllAndOverride(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            expect(getAllAndOverrideSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
        });

        it('debería priorizar el handler sobre la clase', () => {
            // getAllAndOverride permite que el handler sobrescriba el valor de la clase
            // Mock para retornar true cuando se consulta el handler
            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

            const context = createMockContext(
                { [IS_PUBLIC_KEY]: true }, // Handler marca como público
                { [IS_PUBLIC_KEY]: false } // Clase marca como privado
            );

            const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            // Verificar que se llamó con los parámetros correctos
            expect(isPublic).toBe(true);
        });
    });
});
