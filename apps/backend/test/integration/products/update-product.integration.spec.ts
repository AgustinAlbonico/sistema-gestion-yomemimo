/**
 * Tests de integración para actualizar productos
 */
import { testDataSource } from '../../setup-integration';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { Category } from '../../../src/modules/products/entities/category.entity';
import { Brand } from '../../../src/modules/products/entities/brand.entity';
import { createCategoryDTO, resetCategoryCounter } from '../../factories/category.factory';
import { createBrandDTO, resetBrandCounter } from '../../factories/brand.factory';
import { createProductDTO, resetProductCounter } from '../../factories/product.factory';

describe('Integration Tests - Products (Update Product)', () => {
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

    it('actualizar categoría → recalcula precio sin margen personalizado', async () => {
        const categoryData = createCategoryDTO({ profitMargin: 40 });
        const category1 = new Category();
        Object.assign(category1, categoryData);
        await dataSource.getRepository(Category).save(category1);

        const categoryData2 = createCategoryDTO({ name: 'Bebidas' });
        const category2 = new Category();
        Object.assign(category2, categoryData2);
        await dataSource.getRepository(Category).save(category2);

        const productData = createProductDTO({
            cost: 100,
            categoryId: category1.id,
        });

        const product = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        expect(product.price).toBe(140);
        expect(product.profitMargin).toBe(40);

        const result = await productsRepo.save({
            ...product,
            categoryId: category2.id,
        });

        expect(result.price).toBe(140);
        expect(result.profitMargin).toBe(40);
        expect(result.categoryId).toBe(category2.id);
    });

    it('actualizar marca → asocia brand existente', async () => {
        const brandData = createBrandDTO({ name: 'Nike' });
        const brand1 = new Brand();
        Object.assign(brand1, brandData);
        await dataSource.getRepository(Brand).save(brand1);

        const productData = createProductDTO();
        const product = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        const result = await productsRepo.save({
            ...product,
            brandName: 'Nike',
        });

        expect(result.brandId).toBe(brand1.id);
    });

    it('actualizar costo → recalcula precio', async () => {
        const productData = createProductDTO({
            cost: 100,
        });

        const product = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        const result = await productsRepo.save({
            ...product,
            cost: 150,
        });

        expect(result.price).toBeGreaterThan(product.price);
    });

    it('soft delete → marca como inactivo', async () => {
        const productData = createProductDTO({
            cost: 100,
        });

        const product = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        const result = await productsRepo.save({
            ...product,
            isActive: false,
        });

        expect(result.isActive).toBe(false);
    });
});
