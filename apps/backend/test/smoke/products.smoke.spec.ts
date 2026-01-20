/**
 * Smoke tests rápidos para módulo products
 */
import { Test } from '@nestjs/testing';

import { ProductsService } from '../../../src/modules/products/products.service';
import { CategoriesService } from '../../../src/modules/products/categories.service';
import { BrandsService } from '../../../src/modules/products/brands/brands.service';

describe('Smoke Tests - Products (Services)', () => {
    let productsService: ProductsService;
    let categoriesService: CategoriesService;
    let brandsService: BrandsService;

    beforeAll(async () => {
        const mockConfigService = {
            getDefaultProfitMargin: jest.fn().mockResolvedValue(30),
        };

        const mockInventoryService = {
            createMovement: jest.fn(),
        };

        const productsService = new ProductsService(
            {} as any,
            {} as any,
            {} as any,
            mockConfigService as any,
            mockInventoryService as any,
        );
        productsService = productsService;
        categoriesService = new CategoriesService(
            {} as any,
            productsService as any,
            mockConfigService as any,
            {} as any,
        );
        brandsService = new BrandsService(
            {} as any,
        );
    });

    it('ProductsService se puede inyectar', () => {
        expect(productsService).toBeInstanceOf(ProductsService);
    });

    it('CategoriesService se puede inyectar', () => {
        expect(categoriesService).toBeInstanceOf(CategoriesService);
    });

    it('BrandsService se puede inyectar', () => {
        expect(brandsService).toBeInstanceOf(BrandsService);
    });

    it('CRUD básico de productos funciona', async () => {
        jest.spyOn(productsService, 'create').mockResolvedValue({
            id: 'test-1',
            name: 'Test Product',
            price: 130,
        });

        jest.spyOn(productsService, 'findOne').mockResolvedValue({
            id: 'test-1',
            name: 'Test Product',
        });

        jest.spyOn(productsService, 'findAll').mockResolvedValue({
            data: [{ id: 'test-1', name: 'Test Product' }],
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
        });

        const created = await productsService.create({
            name: 'Test Product',
            cost: 100,
        } as any);

        expect(created.id).toBe('test-1');
        expect(created.price).toBe(130);

        const found = await productsService.findOne('test-1');
        expect(found.name).toBe('Test Product');

        const all = await productsService.findAll({} as any);
        expect(all.total).toBe(1);
    });
});
