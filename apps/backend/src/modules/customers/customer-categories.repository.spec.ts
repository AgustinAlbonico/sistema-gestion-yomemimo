/**
 * Tests unitarios para CustomerCategoriesRepository
 * Cubre: métodos de búsqueda y conteo de clientes por categoría
 */
import { DataSource } from 'typeorm';
import { CustomerCategoriesRepository } from './customer-categories.repository';
import { CustomerCategory } from './entities/customer-category.entity';

describe('CustomerCategoriesRepository', () => {
    let repository: CustomerCategoriesRepository;
    let dataSourceMock: jest.Mocked<DataSource>;

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

    // Mock del QueryBuilder
    const createMockQueryBuilder = () => {
        const qb: any = {
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawOne: jest.fn(),
        };
        return qb;
    };

    beforeEach(() => {
        dataSourceMock = {
            createEntityManager: jest.fn().mockReturnValue({}),
        } as unknown as jest.Mocked<DataSource>;

        repository = new CustomerCategoriesRepository(dataSourceMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findActiveCategories()', () => {
        it('debe listar categorías activas ordenadas por nombre', async () => {
            const categories = [
                mockCategory('cat-3', { name: 'Zonal', isActive: true }),
                mockCategory('cat-1', { name: 'Mayorista', isActive: true }),
                mockCategory('cat-2', { name: 'Minorista', isActive: false }),
            ];

            jest.spyOn(repository, 'find').mockResolvedValue(
                categories.filter((c) => c.isActive) as any
            );

            const result = await repository.findActiveCategories();

            expect(repository.find).toHaveBeenCalledWith({
                where: { isActive: true },
                order: { name: 'ASC' },
            });
            expect(result).toHaveLength(2);
            expect(result.every((c) => c.isActive === true)).toBe(true);
        });

        it('debe retornar array vacío si no hay categorías activas', async () => {
            jest.spyOn(repository, 'find').mockResolvedValue([]);

            const result = await repository.findActiveCategories();

            expect(result).toEqual([]);
        });
    });

    describe('findByName()', () => {
        it('debe buscar categoría por nombre', async () => {
            const category = mockCategory('cat-1', { name: 'VIP' });

            jest.spyOn(repository, 'findOne').mockResolvedValue(category as any);

            const result = await repository.findByName('VIP');

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { name: 'VIP' },
            });
            expect(result).toEqual(category);
        });

        it('debe retornar null si no existe', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            const result = await repository.findByName('Inexistente');

            expect(result).toBeNull();
        });
    });

    describe('findByIds()', () => {
        it('debe buscar múltiples categorías por IDs', async () => {
            const categories = [
                mockCategory('cat-1'),
                mockCategory('cat-2'),
                mockCategory('cat-3'),
            ];

            jest.spyOn(repository, 'find').mockResolvedValue(categories as any);

            const ids = ['cat-1', 'cat-2', 'cat-3'];
            const result = await repository.findByIds(ids);

            expect(repository.find).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    // TypeORM In operator
                }),
            });
            expect(result).toEqual(categories);
            expect(result).toHaveLength(3);
        });

        it('debe retornar array vacío si IDs está vacío', async () => {
            jest.spyOn(repository, 'find').mockResolvedValue([]);

            const result = await repository.findByIds([]);

            expect(result).toEqual([]);
        });
    });

    describe('countCustomersByCategory()', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = createMockQueryBuilder();
            jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as never);
        });

        it('debe contar clientes por categoría', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ count: '5' });

            const result = await repository.countCustomersByCategory('cat-1');

            expect(repository.createQueryBuilder).toHaveBeenCalledWith('category');
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'category.customers',
                'customer'
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('category.id = :categoryId', {
                categoryId: 'cat-1',
            });
            expect(mockQueryBuilder.select).toHaveBeenCalledWith('COUNT(customer.id)', 'count');
            expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
            expect(result).toBe(5);
        });

        it('debe retornar 0 si no hay clientes', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ count: '0' });

            const result = await repository.countCustomersByCategory('cat-1');

            expect(result).toBe(0);
        });

        it('debe retornar 0 si query retorna null', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue(null);

            const result = await repository.countCustomersByCategory('cat-1');

            expect(result).toBe(0);
        });

        it('debe convertir string a número correctamente', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ count: '123' });

            const result = await repository.countCustomersByCategory('cat-1');

            expect(typeof result).toBe('number');
            expect(result).toBe(123);
        });
    });
});
