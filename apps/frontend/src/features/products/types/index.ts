export interface Product {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    cost: number;
    price: number;
    profitMargin?: number;
    stock: number;
    minStock: number;
    categoryId?: string;
    category?: Category;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    color?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDTO {
    name: string;
    cost: number;
    stock?: number;
    categoryId?: string;
    isActive?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> { }

export interface ProductFilters {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    sortBy?: 'name' | 'price' | 'cost' | 'stock' | 'createdAt';
    order?: 'ASC' | 'DESC';
}

export interface CreateCategoryDTO {
    name: string;
    description?: string;
    color?: string;
    isActive?: boolean;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> { }

// Tipos de Inventario
export enum StockMovementType {
    IN = 'IN',
    OUT = 'OUT',
}

export interface StockMovement {
    id: string;
    productId: string;
    product?: Product;
    type: StockMovementType;
    quantity: number;
    cost?: number;
    provider?: string;
    notes?: string;
    date: string;
    createdAt: string;
}

export interface CreateStockMovementDTO {
    productId: string;
    type: StockMovementType;
    quantity: number;
    cost?: number;
    provider?: string;
    notes?: string;
    date: string;
}

export interface InventoryStats {
    totalProducts: number;
    productsWithStock: number;
    productsOutOfStock: number;
    productsLowStock: number;
    totalInventoryValue: number;
    totalInventorySaleValue: number;
}

export interface ProductStock {
    id: string;
    name: string;
    sku?: string;
    stock: number;
    minStock: number;
    cost: number;
    price: number;
    categoryId?: string;
}
