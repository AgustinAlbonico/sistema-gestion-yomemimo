/**
 * Utilidades para generar colores aleatorios
 * Paleta de colores similar a los usados en el seed
 */

/**
 * Paleta de colores vibrantes y modernos para categorías
 * Basada en Tailwind CSS colors
 */
const COLOR_PALETTE = [
    '#ec4899', // rosa
    '#f59e0b', // naranja/amber
    '#8b5cf6', // púrpura/violet
    '#06b6d4', // cian
    '#ef4444', // rojo
    '#6366f1', // índigo
    '#14b8a6', // teal
    '#a855f7', // púrpura
    '#f97316', // naranja
    '#eab308', // amarillo
    '#3b82f6', // azul
    '#10b981', // verde
    '#f43f5e', // rosa
    '#84cc16', // lima
    '#06b6d4', // cian
    '#8b5cf6', // violeta
    '#ec4899', // rosa
    '#f59e0b', // amber
    '#22c55e', // verde
    '#3b82f6', // azul
];

/**
 * Genera un color aleatorio de la paleta predefinida
 * @returns Color hexadecimal en formato #RRGGBB
 */
export function generateRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
    return COLOR_PALETTE[randomIndex];
}

/**
 * Genera un color aleatorio basado en el nombre de la categoría
 * Esto asegura que la misma categoría siempre tenga el mismo color
 * @param name Nombre de la categoría
 * @returns Color hexadecimal en formato #RRGGBB
 */
export function generateColorFromName(name: string): string {
    // Calcular un hash simple del nombre
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Usar el hash para seleccionar un color de la paleta
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
}

