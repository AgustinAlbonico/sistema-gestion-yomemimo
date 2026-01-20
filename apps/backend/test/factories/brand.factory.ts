/**
 * Factory para crear marcas/brands de prueba
 */

export interface BrandDTO {
    name: string;
}

let brandCounter = 0;

/**
 * Crea un DTO de marca con valores por defecto
 */
export const createBrandDTO = (overrides: Partial<BrandDTO> = {}): BrandDTO => {
    brandCounter += 1;
    return {
        name: `Marca Test ${brandCounter}`,
        ...overrides,
    };
};

/**
 * Crea múltiples DTOs de marcas
 */
export const createBrandDTOs = (count: number, overrides: Partial<BrandDTO> = {}): BrandDTO[] => {
    return Array.from({ length: count }, () => createBrandDTO(overrides));
};

/**
 * Reset del contador (para tests aislados)
 */
export const resetBrandCounter = () => {
    brandCounter = 0;
};
