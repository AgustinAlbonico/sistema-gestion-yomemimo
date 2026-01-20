/**
 * Tests unitarios para CustomerCategoriesService
 * Cubre: CRUD completo de categorías de clientes
 */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerCategoriesService } from './customer-categories.service';
import { CustomerCategoriesRepository } from './customer-categories.repository';
import { CustomerCategory } from './entities/customer-category.entity';
import { CreateCustomerCategoryDto, UpdateCustomerCategoryDto } from './dto';
import { generateColorFromName } from '../../common/utils/color.utils';

// Mock de la utilidad de color
jest.mock('../../common/utils/color.utils');

describe('CustomerCategoriesService', () => {
    let service: CustomerCategoriesService;
    let categoriesRepository: jest.Mocked<CustomerCategoriesRepository>;

    const mockCategory = (id: string, overrides: Partial<CustomerCategory> = {}): CustomerCategory => ({
        id,
        name: 'VIP',
        description: 'Clientes VIP',
        color: '#FF5733',
        isActive: true,
        customers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as unknown as CustomerCategory);

    beforeEach(() => {
        // Mock del repositorio
        categoriesRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findByName: jest.fn(),
            findActiveCategories: jest.fn(),
            findByIds: jest.fn(),
            countCustomersByCategory: jest.fn(),
        } as unknown as jest.Mocked<CustomerCategoriesRepository>;

        // Crear el servicio manualmente
        service = new CustomerCategoriesService(categoriesRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('create()', () => {
        const validDto: CreateCustomerCategoryDto = {
            name: 'VIP',
            description: 'Clientes VIP con descuentos',
            color: '#FF5733',
            isActive: true,
        };

        beforeEach(() => {
            // Mockear generateColorFromName por defecto
            (generateColorFromName as jest.Mock).mockReturnValue('#FF5733');
        });

        it('debe crear categoría con datos válidos', async () => {
            const category = mockCategory('cat-1');

            categoriesRepository.findByName.mockResolvedValue(null);
            categoriesRepository.create.mockReturnValue(category);
            categoriesRepository.save.mockResolvedValue(category);

            const result = await service.create(validDto as any);

            expect(categoriesRepository.findByName).toHaveBeenCalledWith('VIP');
            expect(categoriesRepository.create).toHaveBeenCalledWith({
                name: 'VIP',
                description: 'Clientes VIP con descuentos',
                color: '#FF5733',
                isActive: true,
            });
            expect(categoriesRepository.save).toHaveBeenCalled();
            expect(result).toEqual(category);
        });

        it('debe lanzar ConflictException si nombre ya existe', async () => {
            const existingCategory = mockCategory('existing');

            categoriesRepository.findByName.mockResolvedValue(existingCategory);

            await expect(service.create(validDto as any)).rejects.toThrow(
                new ConflictException('Ya existe una categoría con ese nombre')
            );

            expect(categoriesRepository.findByName).toHaveBeenCalledWith('VIP');
            expect(categoriesRepository.create).not.toHaveBeenCalled();
        });

        it('debe generar color automático si no se proporciona', async () => {
            const dtoWithoutColor: CreateCustomerCategoryDto = {
                name: 'Mayorista',
                description: 'Clientes mayoristas',
            };

            const generatedColor = '#123456';
            (generateColorFromName as jest.Mock).mockReturnValue(generatedColor);

            const category = mockCategory('cat-1', { color: generatedColor });

            categoriesRepository.findByName.mockResolvedValue(null);
            categoriesRepository.create.mockReturnValue(category);
            categoriesRepository.save.mockResolvedValue(category);

            await service.create(dtoWithoutColor as any);

            expect(generateColorFromName).toHaveBeenCalledWith('Mayorista');
            expect(categoriesRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: generatedColor,
                })
            );
        });

        it('debe usar color proporcionado si existe', async () => {
            const dtoWithColor: CreateCustomerCategoryDto = {
                name: 'Minorista',
                description: 'Clientes minoristas',
                color: '#ABCDEF',
            };

            const category = mockCategory('cat-1', { color: '#ABCDEF' });

            categoriesRepository.findByName.mockResolvedValue(null);
            categoriesRepository.create.mockReturnValue(category);
            categoriesRepository.save.mockResolvedValue(category);

            await service.create(dtoWithColor as any);

            expect(generateColorFromName).not.toHaveBeenCalled();
            expect(categoriesRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: '#ABCDEF',
                })
            );
        });

        it('debe llamar al repositorio con los datos proporcionados (sin isActive)', async () => {
            const dtoWithoutIsActive: CreateCustomerCategoryDto = {
                name: 'Especial',
            };

            const category = mockCategory('cat-1');

            categoriesRepository.findByName.mockResolvedValue(null);
            categoriesRepository.create.mockReturnValue(category);
            categoriesRepository.save.mockResolvedValue(category);

            await service.create(dtoWithoutIsActive as any);

            // El servicio pasa el DTO tal cual, isActive será manejado por la BD (default true)
            expect(categoriesRepository.create).toHaveBeenCalled();
            expect(categoriesRepository.save).toHaveBeenCalled();
        });
    });

    describe('findAll()', () => {
        it('debe listar todas las categorías ordenadas por nombre', async () => {
            const categories = [
                mockCategory('cat-3', { name: 'Zonal' }),
                mockCategory('cat-1', { name: 'Mayorista' }),
                mockCategory('cat-2', { name: 'Minorista' }),
            ];

            categoriesRepository.find.mockResolvedValue(categories);

            const result = await service.findAll();

            expect(categoriesRepository.find).toHaveBeenCalledWith({
                order: { name: 'ASC' },
            });
            expect(result).toEqual(categories);
        });

        it('debe retornar array vacío si no hay categorías', async () => {
            categoriesRepository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findActive()', () => {
        it('debe listar solo categorías activas', async () => {
            const activeCategories = [
                mockCategory('cat-1', { name: 'VIP', isActive: true }),
                mockCategory('cat-2', { name: 'Mayorista', isActive: true }),
            ];

            categoriesRepository.findActiveCategories.mockResolvedValue(activeCategories);

            const result = await service.findActive();

            expect(categoriesRepository.findActiveCategories).toHaveBeenCalled();
            expect(result).toEqual(activeCategories);
            expect(result).toHaveLength(2);
        });

        it('no debe incluir categorías inactivas', async () => {
            const activeCategories = [
                mockCategory('cat-1', { name: 'VIP', isActive: true }),
            ];

            categoriesRepository.findActiveCategories.mockResolvedValue(activeCategories);

            const result = await service.findActive();

            expect(result.every((cat) => cat.isActive === true)).toBe(true);
        });
    });

    describe('findOne()', () => {
        it('debe obtener categoría por ID', async () => {
            const category = mockCategory('cat-1');

            categoriesRepository.findOne.mockResolvedValue(category);

            const result = await service.findOne('cat-1');

            expect(categoriesRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
            });
            expect(result).toEqual(category);
        });

        it('debe lanzar NotFoundException si categoría no existe', async () => {
            categoriesRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(
                new NotFoundException('Categoría no encontrada')
            );
        });
    });

    describe('update()', () => {
        it('debe actualizar categoría exitosamente', async () => {
            const existingCategory = mockCategory('cat-1', { name: 'VIP', description: 'Antiguo' });
            const updatedCategory = mockCategory('cat-1', {
                name: 'VIP',
                description: 'Nueva descripción',
            });

            const updateDto: UpdateCustomerCategoryDto = {
                description: 'Nueva descripción',
            };

            categoriesRepository.findOne.mockResolvedValue(existingCategory);
            categoriesRepository.findByName.mockResolvedValue(null);
            categoriesRepository.save.mockResolvedValue(updatedCategory);

            const result = await service.update('cat-1', updateDto);

            expect(categoriesRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
            });
            expect(categoriesRepository.save).toHaveBeenCalled();
            expect(result).toEqual(updatedCategory);
        });

        it('debe lanzar NotFoundException si categoría no existe', async () => {
            const updateDto: UpdateCustomerCategoryDto = {
                name: 'Nuevo Nombre',
            };

            categoriesRepository.findOne.mockResolvedValue(null);

            await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
                new NotFoundException('Categoría no encontrada')
            );
        });

        it('debe lanzar ConflictException si nombre duplicado en update', async () => {
            const existingCategory = mockCategory('cat-1', { name: 'VIP' });
            const anotherCategory = mockCategory('cat-2', { name: 'Mayorista' });

            const updateDto: UpdateCustomerCategoryDto = {
                name: 'Mayorista',
            };

            categoriesRepository.findOne.mockResolvedValue(existingCategory);
            categoriesRepository.findByName.mockResolvedValue(anotherCategory);

            await expect(service.update('cat-1', updateDto)).rejects.toThrow(
                new ConflictException('Ya existe una categoría con ese nombre')
            );
        });

        it('debe permitir actualizar con mismo nombre', async () => {
            const existingCategory = mockCategory('cat-1', { name: 'VIP' });

            const updateDto: UpdateCustomerCategoryDto = {
                name: 'VIP', // Mismo nombre
                description: 'Nueva descripción',
            };

            categoriesRepository.findOne.mockResolvedValue(existingCategory);
            categoriesRepository.findByName.mockResolvedValue(existingCategory);
            categoriesRepository.save.mockResolvedValue(existingCategory);

            const result = await service.update('cat-1', updateDto);

            expect(categoriesRepository.save).toHaveBeenCalled();
            expect(result).toEqual(existingCategory);
        });

        it('debe actualizar todos los campos proporcionados', async () => {
            const existingCategory = mockCategory('cat-1', {
                name: 'VIP',
                description: 'Antigua',
                color: '#FF0000',
                isActive: true,
            });

            const updateDto: UpdateCustomerCategoryDto = {
                name: 'Premium',
                description: 'Nueva descripción',
                color: '#00FF00',
                isActive: false,
            };

            const updatedCategory = mockCategory('cat-1', {
                name: 'Premium',
                description: 'Nueva descripción',
                color: '#00FF00',
                isActive: false,
            });

            categoriesRepository.findOne.mockResolvedValue(existingCategory);
            categoriesRepository.findByName.mockResolvedValue(null);
            categoriesRepository.save.mockResolvedValue(updatedCategory);

            const result = await service.update('cat-1', updateDto);

            expect(result).toEqual(updatedCategory);
        });
    });

    describe('remove()', () => {
        it('debe eliminar categoría sin clientes asociados', async () => {
            const category = mockCategory('cat-1');

            categoriesRepository.findOne.mockResolvedValue(category);
            categoriesRepository.countCustomersByCategory.mockResolvedValue(0);
            categoriesRepository.remove.mockResolvedValue(category);

            const result = await service.remove('cat-1');

            expect(categoriesRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
            });
            expect(categoriesRepository.countCustomersByCategory).toHaveBeenCalledWith('cat-1');
            expect(categoriesRepository.remove).toHaveBeenCalledWith(category);
            expect(result).toEqual({ message: 'Categoría eliminada exitosamente' });
        });

        it('debe lanzar ConflictException si categoría tiene clientes', async () => {
            const category = mockCategory('cat-1');

            categoriesRepository.findOne.mockResolvedValue(category);
            categoriesRepository.countCustomersByCategory.mockResolvedValue(5);

            await expect(service.remove('cat-1')).rejects.toThrow(
                new ConflictException('No se puede eliminar una categoría con 5 cliente(s) asociado(s)')
            );
        });

        it('debe incluir cantidad de clientes en mensaje de error', async () => {
            const category = mockCategory('cat-1');

            categoriesRepository.findOne.mockResolvedValue(category);
            categoriesRepository.countCustomersByCategory.mockResolvedValue(1);

            await expect(service.remove('cat-1')).rejects.toThrow(
                new ConflictException('No se puede eliminar una categoría con 1 cliente(s) asociado(s)')
            );
        });

        it('debe lanzar NotFoundException si categoría no existe', async () => {
            categoriesRepository.findOne.mockResolvedValue(null);

            await expect(service.remove('nonexistent')).rejects.toThrow(
                new NotFoundException('Categoría no encontrada')
            );
        });
    });
});
