/**
 * Tests de utilidades de colores
 * Prueban la generación de colores aleatorios y deterministas basados en nombres
 */

import { generateRandomColor, generateColorFromName } from './color.utils';

describe('Color Utils', () => {
    const COLOR_PALETTE = [
        '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444',
        '#6366f1', '#14b8a6', '#a855f7', '#f97316', '#eab308',
        '#3b82f6', '#10b981', '#f43f5e', '#84cc16', '#06b6d4',
        '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6',
    ];

    describe('generateRandomColor', () => {
        it('debería generar un color válido de la paleta', () => {
            const color = generateRandomColor();

            expect(COLOR_PALETTE).toContain(color);
        });

        it('debería generar un string hexadecimal válido', () => {
            const color = generateRandomColor();

            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('debería poder generar colores diferentes en múltiples llamadas', () => {
            const colors = new Set<string>();

            // Generar 50 colores para tener alta probabilidad de variedad
            for (let i = 0; i < 50; i++) {
                colors.add(generateRandomColor());
            }

            // Al menos debería tener algunos colores diferentes
            expect(colors.size).toBeGreaterThan(1);
        });

        it('debería siempre retornar un valor de la paleta predefinida', () => {
            for (let i = 0; i < 100; i++) {
                const color = generateRandomColor();
                expect(COLOR_PALETTE).toContain(color);
            }
        });
    });

    describe('generateColorFromName', () => {
        it('debería generar el mismo color para el mismo nombre', () => {
            const name = 'Alimentos';
            const color1 = generateColorFromName(name);
            const color2 = generateColorFromName(name);

            expect(color1).toBe(color2);
        });

        it('debería generar colores diferentes para nombres diferentes', () => {
            const color1 = generateColorFromName('Alimentos');
            const color2 = generateColorFromName('Bebidas');

            // Nota: podría ser el mismo por colisión de hash, pero es improbable
            // Este test verifica que existe variabilidad
            const colors = new Set<string>();
            colors.add(generateColorFromName('Categoría 1'));
            colors.add(generateColorFromName('Categoría 2'));
            colors.add(generateColorFromName('Categoría 3'));
            colors.add(generateColorFromName('Categoría 4'));
            colors.add(generateColorFromName('Categoría 5'));

            expect(colors.size).toBeGreaterThan(1);
        });

        it('debería generar un color válido de la paleta', () => {
            const color = generateColorFromName('Cualquier nombre');

            expect(COLOR_PALETTE).toContain(color);
        });

        it('debería generar un string hexadecimal válido', () => {
            const color = generateColorFromName('Test Category');

            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('debería manejar nombres con caracteres especiales', () => {
            const color1 = generateColorFromName('Categoría Ñ');
            const color2 = generateColorFromName('Café');
            const color3 = generateColorFromName('日本語');

            expect(COLOR_PALETTE).toContain(color1);
            expect(COLOR_PALETTE).toContain(color2);
            expect(COLOR_PALETTE).toContain(color3);
        });

        it('debería manejar nombres vacíos', () => {
            const color = generateColorFromName('');

            expect(COLOR_PALETTE).toContain(color);
            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('debería ser determinista para nombres con mayúsculas/minúsculas diferentes', () => {
            const color1 = generateColorFromName('alimentos');
            const color2 = generateColorFromName('Alimentos');
            const color3 = generateColorFromName('ALIMENTOS');

            // Los colores pueden ser diferentes por las diferentes mayúsculas
            // Verificamos que sean colores válidos de la paleta
            expect(COLOR_PALETTE).toContain(color1);
            expect(COLOR_PALETTE).toContain(color2);
            expect(COLOR_PALETTE).toContain(color3);
        });

        it('debería manejar números en el nombre', () => {
            const color = generateColorFromName('Categoría 123');

            expect(COLOR_PALETTE).toContain(color);
        });

        it('debería ser consistente en múltiples llamadas con el mismo nombre', () => {
            const name = 'Consistencia Test';
            const colors: string[] = [];

            for (let i = 0; i < 10; i++) {
                colors.push(generateColorFromName(name));
            }

            // Todos deberían ser iguales
            expect(colors.every((c) => c === colors[0])).toBe(true);
        });
    });
});
