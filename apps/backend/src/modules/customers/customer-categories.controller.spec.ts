/**
 * Tests unitarios para CustomerCategoriesController
 * Cubre: Todos los endpoints del controlador
 */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerCategoriesController } from './customer-categories.controller';
import { CustomerCategoriesService } from './customer-categories.service';
import { CreateCustomerCategoryDto, UpdateCustomerCategoryDto } from './dto';

describe('CustomerCategoriesController', () => {
    let controller: CustomerCategoriesController;
    let service: jest.Mocked<CustomerCategoriesService>;

    const mockCategory = (id: string, overrides = {}) => ({
        id,
        name: 'VIP',
        description: 'Clientes VIP',
        color: '#FF5733',
        isActive: true,
        customers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    beforeEach(() => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            findActive: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        } as unknown as jest.Mocked<CustomerCategoriesService>;

        controller = new CustomerCategoriesController(service);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create()', () => {
        const validDto: CreateCustomerCategoryDto = {
            name: 'VIP',
            description: 'Clientes VIP',
            color: '#FF5733',
            isActive: true,
        };

        it('debe crear categoría y retornarla', async () => {
            const created = mockCategory('cat-1');
            service.create.mockResolvedValue(created);

            const result = await controller.create(validDto);

            expect(service.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(created);
        });
    });

    describe('findAll()', () => {
        it('debe listar todas las categorías', async () => {
            const categories = [
                mockCategory('cat-1', { name: 'Mayorista' }),
                mockCategory('cat-2', { name: 'Minorista' }),
            ];
            service.findAll.mockResolvedValue(categories);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalled();
            expect(result).toEqual(categories);
        });
    });

    describe('findActive()', () => {
        it('debe listar solo categorías activas', async () => {
            const activeCategories = [
                mockCategory('cat-1', { name: 'VIP', isActive: true }),
                mockCategory('cat-2', { name: 'Premium', isActive: true }),
            ];
            service.findActive.mockResolvedValue(activeCategories);

            const result = await controller.findActive();

            expect(service.findActive).toHaveBeenCalled();
            expect(result).toEqual(activeCategories);
        });
    });

    describe('findOne()', () => {
        it('debe retornar categoría por ID', async () => {
            const category = mockCategory('cat-1');
            service.findOne.mockResolvedValue(category);

            const result = await controller.findOne('cat-1');

            expect(service.findOne).toHaveBeenCalledWith('cat-1');
            expect(result).toEqual(category);
        });

        it('debe propagar NotFoundException si no existe', async () => {
            service.findOne.mockRejectedValue(new NotFoundException('Categoría no encontrada'));

            await expect(controller.findOne('nonexistent')).rejects.toThrow(
                NotFoundException
            );
        });
    });

    describe('update()', () => {
        it('debe actualizar categoría', async () => {
            const updateDto: UpdateCustomerCategoryDto = {
                name: 'Premium',
            };
            const updated = mockCategory('cat-1', { name: 'Premium' });
            service.update.mockResolvedValue(updated);

            const result = await controller.update('cat-1', updateDto);

            expect(service.update).toHaveBeenCalledWith('cat-1', updateDto);
            expect(result).toEqual(updated);
        });
    });

    describe('remove()', () => {
        it('debe eliminar categoría', async () => {
            const result = { message: 'Categoría eliminada exitosamente' };
            service.remove.mockResolvedValue(result);

            const response = await controller.remove('cat-1');

            expect(service.remove).toHaveBeenCalledWith('cat-1');
            expect(response).toEqual(result);
        });
    });
});
