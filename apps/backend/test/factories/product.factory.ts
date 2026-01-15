/**
 * Factory para crear productos de prueba
 */

import { DeepPartial } from 'typeorm';

export interface ProductDTO {
    name: string;
    description?: string;
    cost: number;
    price?: number;
    profitMargin?: number;
    stock?: number;
    categoryId?: string | null;
    brandName?: string | null;
    isActive?: boolean;
}

let productCounter = 0;

/**
 * Crea un DTO de producto con valores por defecto
 */
export const createProductDTO = (overrides: Partial<ProductDTO> = {}): ProductDTO => {
    productCounter++;
    return {
        name: `Producto Test ${productCounter}`,
        description: 'Descripción de prueba',
        cost: 100,
        stock: 10,
        categoryId: null,
        brandName: null,
        isActive: true,
        ...overrides,
    };
};

/**
 * Crea múltiples DTOs de productos
 */
export const createProductDTOs = (count: number, overrides: Partial<ProductDTO> = {}): ProductDTO[] => {
    return Array.from({ length: count }, () => createProductDTO(overrides));
};

/**
 * Reset del contador (para tests aislados)
 */
export const resetProductCounter = () => {
    productCounter = 0;
};
