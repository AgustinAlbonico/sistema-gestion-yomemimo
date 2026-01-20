/**
 * Tests de integración para eliminar categoría
 */
import { testDataSource } from '../../setup-integration';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { Category } from '../../../src/modules/products/entities/category.entity';
import { createCategoryDTO } from '../../factories/category.factory';
import { createProductDTO } from '../../factories/product.factory';

describe('Integration Tests - Products (Delete Category)', () => {
    let dataSource: DataSource;
    let productsRepo: any;
    let categoriesRepo: any;

    beforeAll(async () => {
        dataSource = testDataSource;
        productsRepo = dataSource.getRepository(Product);
        categoriesRepo = dataSource.getRepository(Category);
    });

    beforeEach(async () => {
        await productsRepo.clear();
        await categoriesRepo.clear();
    });

    afterAll(async () => {
        await productsRepo.clear();
        await categoriesRepo.clear();
        await dataSource.destroy();
    });

    it('eliminar categoría con productos', async () => {
        const categoryData = createCategoryDTO({ profitMargin: 30 });
        const category = new Category();
        Object.assign(category, categoryData);
        await categoriesRepo.save(category);

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

        await categoriesRepo.delete(category.id);

        const reloaded1 = await productsRepo.findOne({ where: { id: product1.id } });
        const reloaded2 = await productsRepo.findOne({ where: { id: product2.id } });

        expect(reloaded1.categoryId).toBeNull();
        expect(reloaded1.profitMargin).toBe(30);
        expect(reloaded1.useCustomMargin).toBe(false);

        expect(reloaded2.categoryId).toBeNull();
        expect(reloaded2.profitMargin).toBe(50);
        expect(reloaded2.useCustomMargin).toBe(true);
    });
});
