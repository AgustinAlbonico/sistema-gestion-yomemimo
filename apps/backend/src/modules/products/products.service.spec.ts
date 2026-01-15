/**
 * Tests unitarios para ProductsService
 * Cobertura del fix 7.7: Producto con precio $0
 * + Tests adicionales para cobertura completa
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from './categories.repository';
import { BrandsRepository } from './brands.repository';
import { ConfigurationService } from '../configuration/configuration.service';
import { InventoryService } from '../inventory/inventory.service';

// Mocks
const mockProductsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findWithFilters: jest.fn(),
};

const mockCategoriesRepository = {
    findOne: jest.fn(),
};

const mockBrandsRepository = {
    findOrCreateByName: jest.fn(),
};

const mockConfigurationService = {
    getDefaultProfitMargin: jest.fn().mockResolvedValue(30),
    getMinStockAlert: jest.fn().mockResolvedValue(5),
};

const mockInventoryService = {
    createMovement: jest.fn(),
};

describe('ProductsService', () => {
    let service: ProductsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: ProductsRepository, useValue: mockProductsRepository },
                { provide: CategoriesRepository, useValue: mockCategoriesRepository },
                { provide: BrandsRepository, useValue: mockBrandsRepository },
                { provide: ConfigurationService, useValue: mockConfigurationService },
                { provide: InventoryService, useValue: mockInventoryService },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getEffectiveProfitMargin', () => {
        it('retorna margen personalizado cuando useCustomMargin es true', async () => {
            const result = await service.getEffectiveProfitMargin(true, 50, null);
            expect(result).toBe(50);
        });

        it('retorna margen de categoría cuando no hay margen personalizado', async () => {
            const category = { id: '1', name: 'Test', profitMargin: 40 } as any;
            const result = await service.getEffectiveProfitMargin(false, undefined, category);
            expect(result).toBe(40);
        });

        it('retorna margen del sistema cuando no hay categoría ni margen personalizado', async () => {
            mockConfigurationService.getDefaultProfitMargin.mockResolvedValue(30);
            const result = await service.getEffectiveProfitMargin(false, undefined, null);
            expect(result).toBe(30);
            expect(mockConfigurationService.getDefaultProfitMargin).toHaveBeenCalled();
        });

        it('ignora margen personalizado si useCustomMargin es false', async () => {
            mockConfigurationService.getDefaultProfitMargin.mockResolvedValue(30);
            const result = await service.getEffectiveProfitMargin(false, 50, null);
            expect(result).toBe(30);
        });

        it('usa margen del sistema si categoría tiene profitMargin null', async () => {
            const category = { id: '1', name: 'Test', profitMargin: null } as any;
            mockConfigurationService.getDefaultProfitMargin.mockResolvedValue(25);
            const result = await service.getEffectiveProfitMargin(false, undefined, category);
            expect(result).toBe(25);
        });
    });

    describe('findOne', () => {
        it('retorna producto cuando existe', async () => {
            const mockProduct = { id: 'uuid-123', name: 'Test' };
            mockProductsRepository.findOne.mockResolvedValue(mockProduct);

            const result = await service.findOne('uuid-123');

            expect(result).toEqual(mockProduct);
        });

        it('lanza NotFoundException cuando no existe', async () => {
            mockProductsRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('invalid-id')).rejects.toThrow('Producto no encontrado');
        });
    });

    describe('FIX 7.7: calculatePrice - Productos con costo $0', () => {
        // Accedemos al método privado para testear
        // En producción, esto se testearía indirectamente a través de create/update

        it('debe retornar 0 cuando el costo es 0', () => {
            // Usamos reflection para acceder al método privado
            const calculatePrice = (service as any).calculatePrice.bind(service);

            const result = calculatePrice(0, 30);

            expect(result).toBe(0);
        });

        it('debe retornar 0 cuando el costo es negativo', () => {
            const calculatePrice = (service as any).calculatePrice.bind(service);

            const result = calculatePrice(-10, 30);

            expect(result).toBe(0);
        });

        it('debe calcular precio correctamente para costos positivos', () => {
            const calculatePrice = (service as any).calculatePrice.bind(service);

            // Costo $100 con 30% margen = $130
            const result = calculatePrice(100, 30);

            expect(result).toBe(130);
        });

        it('debe redondear a 2 decimales', () => {
            const calculatePrice = (service as any).calculatePrice.bind(service);

            // Costo $100 con 33.33% margen = $133.33
            const result = calculatePrice(100, 33.33);

            expect(result).toBe(133.33);
        });

        it('debe manejar margen 0%', () => {
            const calculatePrice = (service as any).calculatePrice.bind(service);

            const result = calculatePrice(100, 0);

            expect(result).toBe(100);
        });

        it('debe manejar margen 100%', () => {
            const calculatePrice = (service as any).calculatePrice.bind(service);

            const result = calculatePrice(100, 100);

            expect(result).toBe(200);
        });
    });

    describe('create', () => {
        const createProductDTO = {
            name: 'Test Product',
            cost: 100,
            stock: 0,
            categoryId: null,
            brandName: null,
        };

        beforeEach(() => {
            mockProductsRepository.create.mockImplementation((data) => ({ id: 'uuid-123', ...data }));
            mockProductsRepository.save.mockImplementation((product) => Promise.resolve(product));
            mockConfigurationService.getDefaultProfitMargin.mockResolvedValue(30);
        });

        it('crea producto con precio calculado', async () => {
            await service.create(createProductDTO as any);

            expect(mockProductsRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Test Product',
                    cost: 100,
                    price: 130,
                    profitMargin: 30,
                })
            );
        });

        it('lanza error si categoría no existe', async () => {
            mockCategoriesRepository.findOne.mockResolvedValue(null);
            const dto = { ...createProductDTO, categoryId: 'fake-id' };

            await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
        });

        it('procesa marca cuando se proporciona brandName', async () => {
            const mockBrand = { id: 'brand-1', name: 'Nike' };
            mockBrandsRepository.findOrCreateByName.mockResolvedValue(mockBrand);

            await service.create({ ...createProductDTO, brandName: 'Nike' } as any);

            expect(mockBrandsRepository.findOrCreateByName).toHaveBeenCalledWith('Nike');
        });

        it('no procesa marca si brandName es vacío', async () => {
            await service.create({ ...createProductDTO, brandName: '' } as any);

            expect(mockBrandsRepository.findOrCreateByName).not.toHaveBeenCalled();
        });

        it('crea movimiento de stock si hay stock inicial', async () => {
            const dto = { ...createProductDTO, stock: 10 };
            mockProductsRepository.findOne.mockResolvedValue({ id: 'uuid-123', stock: 10 });

            await service.create(dto as any);

            expect(mockInventoryService.createMovement).toHaveBeenCalledWith(
                expect.objectContaining({
                    productId: 'uuid-123',
                    quantity: 10,
                    type: 'IN',
                    source: 'INITIAL_LOAD',
                })
            );
        });

        it('no crea movimiento si stock es 0', async () => {
            await service.create(createProductDTO as any);

            expect(mockInventoryService.createMovement).not.toHaveBeenCalled();
        });
    });
});
