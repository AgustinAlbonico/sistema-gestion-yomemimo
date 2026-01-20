/**
 * Tests de integración para recalcular categoría
 */
import { testDataSource } from '../../setup-integration';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { Category } from '../../../src/modules/products/entities/category.entity';
import { createCategoryDTO } from '../../factories/category.factory';
import { createProductDTO } from '../../factories/product.factory';

describe('Integration Tests - Products (Recalculate Category)', () => {
    let dataSource: DataSource;
    let productsRepo: any;

    beforeAll(async () => {
        dataSource = testDataSource;
        productsRepo = dataSource.getRepository(Product);
    });

    beforeEach(async () => {
        const products = await productsRepo.find();
        if (products.length > 0) {
            for (const p of products) {
                await productsRepo.delete(p);
            }
        }
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it('recalcular productos de categoría al cambiar profitMargin', async () => {
        const categoryData = createCategoryDTO({ profitMargin: 30 });
        const category = new Category();
        Object.assign(category, categoryData);
        await dataSource.getRepository(Category).save(category);

        const productData1 = createProductDTO({
            categoryId: category.id,
            useCustomMargin: false,
        });
        const product1 = await productsRepo.save(
            Object.assign(new Product(), productData1),
        );

        const productData2 = createProductDTO({
            categoryId: category.id,
            useCustomMargin: true,
            customProfitMargin: 50,
        });
        const product2 = await productsRepo.save(
            Object.assign(new Product(), productData2),
        );

        const updatedCategory = new Category();
        Object.assign(updatedCategory, categoryData, { profitMargin: 40 });
        await dataSource.getRepository(Category).save(updatedCategory);

        await productsRepo.save({ ...product1, profitMargin: 40, price: 140 });
        await productsRepo.save({ ...product2 });

        const products = await productsRepo.find({
            where: { categoryId: category.id, isActive: true },
            order: { createdAt: 'ASC' },
        });

        expect(products.length).toBe(2);
        expect(products[0].profitMargin).toBe(40);
        expect(products[0].price).toBe(140);
        expect(products[1].profitMargin).toBe(50);
        expect(products[1].price).not.toBe(140);
    });

    it('no actualiza productos con useCustomMargin=true', async () => {
        const categoryData = createCategoryDTO({ profitMargin: 30 });
        const category = new Category();
        Object.assign(category, categoryData);
        await dataSource.getRepository(Category).save(category);

        const productData = createProductDTO({
            categoryId: category.id,
            useCustomMargin: true,
            customProfitMargin: 50,
        });
        const product = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        const updatedCategory = new Category();
        Object.assign(updatedCategory, categoryData, { profitMargin: 40 });
        await dataSource.getRepository(Category).save(updatedCategory);

        await productsRepo.save({ ...product, profitMargin: 40, price: 140 });

        const reloaded = await productsRepo.findOne({ where: { id: product.id } });

        expect(reloaded.profitMargin).toBe(50);
        expect(reloaded.price).not.toBe(140);
    });

    it('no actualiza productos inactivos', async () => {
        const categoryData = createCategoryDTO({ profitMargin: 30 });
        const category = new Category();
        Object.assign(category, categoryData);
        await dataSource.getRepository(Category).save(category);

        const productData = createProductDTO({
            categoryId: category.id,
            useCustomMargin: false,
            isActive: false,
        });
        const product = await productsRepo.save(
            Object.assign(new Product(), productData),
        );

        const updatedCategory = new Category();
        Object.assign(updatedCategory, categoryData, { profitMargin: 40 });
        await dataSource.getRepository(Category).save(updatedCategory);

        await productsRepo.save({ ...product, profitMargin: 40, price: 140 });

        const reloaded = await productsRepo.findOne({ where: { id: product.id } });

        expect(reloaded.profitMargin).not.toBe(40);
        expect(reloaded.price).not.toBe(140);
    });
});
