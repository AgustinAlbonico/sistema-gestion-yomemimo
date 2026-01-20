/**
 * Factory para crear categorías de prueba
 */

export interface CategoryDTO {
    name: string;
    description?: string;
    color?: string;
    profitMargin?: number;
    isActive?: boolean;
}

let categoryCounter = 0;

/**
 * Crea un DTO de categoría con valores por defecto
 */
export const createCategoryDTO = (overrides: Partial<CategoryDTO> = {}): CategoryDTO => {
    categoryCounter += 1;
    return {
        name: `Categoría Test ${categoryCounter}`,
        description: 'Descripción de prueba',
        color: '#FF5733',
        profitMargin: 30,
        isActive: true,
        ...overrides,
    };
};

/**
 * Crea múltiples DTOs de categorías
 */
export const createCategoryDTOs = (count: number, overrides: Partial<CategoryDTO> = {}): CategoryDTO[] => {
    return Array.from({ length: count }, () => createCategoryDTO(overrides));
};

/**
 * Reset del contador (para tests aislados)
 */
export const resetCategoryCounter = () => {
    categoryCounter = 0;
};
