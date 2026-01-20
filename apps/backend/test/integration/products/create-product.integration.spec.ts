/**
 * Tests de integración para crear productos
 */
import { testDataSource } from '../../setup-integration';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { Category } from '../../../src/modules/products/entities/category.entity';
import { Brand } from '../../../src/modules/products/entities/brand.entity';
import { createCategoryDTO, resetCategoryCounter } from '../../factories/category.factory';
import { createBrandDTO, resetBrandCounter } from '../../factories/brand.factory';
import { createProductDTO, resetProductCounter } from '../../factories/product.factory';

describe('Integration Tests - Products (Create Product)', () => {
    let dataSource: DataSource;
    let productsRepo: any;

    beforeAll(async () => {
        dataSource = testDataSource;
        productsRepo = dataSource.getRepository(Product);
    });

    beforeEach(async () => {
        const brandRepo = dataSource.getRepository(Brand);
        const categoryRepo = dataSource.getRepository(Category);
        await productsRepo.clear();
        await brandRepo.clear();
        await categoryRepo.clear();
        resetCategoryCounter();
        resetBrandCounter();
        resetProductCounter();
    });

    afterAll(async () => {
        await productsRepo.clear();
    });

    it('crear producto con categoría y marca', async () => {
        const categoryData = createCategoryDTO();
        const category = new Category();
        Object.assign(category, categoryData);
        const savedCategory = await dataSource.getRepository(Category).save(category);

        const brandData = createBrandDTO({ name: 'Nike' });
        const brand = new Brand();
        Object.assign(brand, brandData);
        const savedBrand = await dataSource.getRepository(Brand).save(brand);

        const productData = createProductDTO({
            categoryId: category.id,
            brandName: brand.name,
            stock: 20,
        });

        const result = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        expect(result.id).toBeDefined();
        expect(result.name).toBe(productData.name);
        expect(result.categoryId).toBe(category.id);
        expect(result.brandId).toBe(brand.id);
        expect(result.price).toBeGreaterThan(0);
        expect(result.profitMargin).toBe(30);
    });

    it('verificar que precio se calcula automáticamente', async () => {
        const productData = createProductDTO({
            cost: 100,
        });

        const result = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        expect(result.cost).toBe(100);
        expect(result.price).toBe(130);
        expect(result.profitMargin).toBe(30);
    });

    it('verificar relaciones cargadas (category, brand)', async () => {
        const categoryData = createCategoryDTO({ name: 'Electrónicos' });
        const category = new Category();
        Object.assign(category, categoryData);
        await dataSource.getRepository(Category).save(category);

        const brandData = createBrandDTO({ name: 'Sony' });
        const brand = new Brand();
        Object.assign(brand, brandData);
        await dataSource.getRepository(Brand).save(brand);

        const productData = createProductDTO({
            categoryId: category.id,
            brandName: brand.name,
        });

        const saved = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        const loaded = await productsRepo.findOne({
            where: { id: saved.id },
            relations: ['category', 'brand'],
        });

        expect(loaded.categoryId).toBe(category.id);
        expect(loaded.brandId).toBe(brand.id);
        expect(loaded.category).toBeDefined();
        expect(loaded.brand).toBeDefined();
        expect(loaded.category.name).toBe('Electrónicos');
        expect(loaded.brand.name).toBe('Sony');
    });

    it('crear producto con stock inicial crea movimiento en InventoryService', async () => {
        jest.mock('../../../src/modules/inventory/inventory.service', () => ({
            createMovement: jest.fn().mockResolvedValue(undefined),
        }));

        const InventoryService = (await import('../../../src/modules/inventory/inventory.service')).InventoryService;

        const productData = createProductDTO({
            stock: 15,
        });

        await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        expect(InventoryService.createMovement).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'IN',
                source: 'INITIAL_LOAD',
                quantity: 15,
            })
        );

        jest.clearAllMocks();
    });
});
