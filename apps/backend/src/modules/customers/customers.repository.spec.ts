/**
 * Tests unitarios para CustomersRepository
 * Cubre: métodos de búsqueda, filtros y estadísticas
 */
import { DataSource } from 'typeorm';
import { CustomersRepository } from './customers.repository';
import { Customer, DocumentType } from './entities/customer.entity';
import { IvaCondition } from '../../common/enums/iva-condition.enum';
import { QueryCustomersDTO } from './dto/query-customers.dto';

describe('CustomersRepository', () => {
    let repository: CustomersRepository;
    let dataSourceMock: jest.Mocked<DataSource>;

    const mockCustomer = (id: string, overrides: Partial<Customer> = {}): Customer => ({
        id,
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: DocumentType.DNI,
        ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
        documentNumber: '12345678',
        email: 'juan@example.com',
        phone: '11-1234-5678',
        mobile: '11-9876-5432',
        address: 'Calle Test 123',
        city: 'Buenos Aires',
        state: 'B',
        postalCode: '1234',
        categoryId: 'cat-1',
        notes: 'Notas',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: null,
        ...overrides,
    } as unknown as Customer);

    // Mock del QueryBuilder con chainable methods
    const createMockQueryBuilder = () => {
        const qb: any = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn(),
            getRawMany: jest.fn(),
            getRawOne: jest.fn(),
        };
        return qb;
    };

    beforeEach(() => {
        // Mock de DataSource
        dataSourceMock = {
            createEntityManager: jest.fn().mockReturnValue({
                // EntityManager mock methods
            }),
        } as unknown as jest.Mocked<DataSource>;

        // Crear repositorio
        repository = new CustomersRepository(dataSourceMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findWithFilters()', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = createMockQueryBuilder();
            // Mock createQueryBuilder para retornar nuestro mock
            jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as never);
        });

        it('debe aplicar filtro de búsqueda por texto', async () => {
            const customers = [mockCustomer('c1'), mockCustomer('c2')];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([customers, 2]);

            const filters: QueryCustomersDTO = {
                page: 1,
                limit: 10,
                search: 'Juan',
                sortBy: 'lastName',
                order: 'ASC',
            };

            const result = await repository.findWithFilters(filters);

            expect(repository.createQueryBuilder).toHaveBeenCalledWith('customer');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'customer.category',
                'category'
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.documentNumber ILIKE :search)',
                { search: '%Juan%' }
            );
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('customer.lastName', 'ASC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result).toEqual([customers, 2]);
        });

        it('debe aplicar filtro por categoría', async () => {
            const customers = [mockCustomer('c1', { categoryId: 'cat-1' })];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([customers, 1]);

            const filters: QueryCustomersDTO = {
                page: 1,
                limit: 10,
                categoryId: 'cat-1',
                sortBy: 'lastName',
                order: 'ASC',
            };

            await repository.findWithFilters(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'customer.categoryId = :categoryId',
                { categoryId: 'cat-1' }
            );
        });

        it('debe aplicar filtro por estado activo/inactivo', async () => {
            const customers = [mockCustomer('c1', { isActive: true })];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([customers, 1]);

            const filters: QueryCustomersDTO = {
                page: 1,
                limit: 10,
                isActive: true,
                sortBy: 'lastName',
                order: 'ASC',
            };

            await repository.findWithFilters(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'customer.isActive = :isActive',
                { isActive: true }
            );
        });

        it('debe aplicar filtro por ciudad', async () => {
            const customers = [mockCustomer('c1', { city: 'Rosario' })];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([customers, 1]);

            const filters: QueryCustomersDTO = {
                page: 1,
                limit: 10,
                city: 'Rosario',
                sortBy: 'lastName',
                order: 'ASC',
            };

            await repository.findWithFilters(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'customer.city ILIKE :city',
                { city: '%Rosario%' }
            );
        });

        it('debe aplicar filtro por provincia', async () => {
            const customers = [mockCustomer('c1', { state: 'Santa Fe' })];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([customers, 1]);

            const filters: QueryCustomersDTO = {
                page: 1,
                limit: 10,
                state: 'Santa Fe',
                sortBy: 'lastName',
                order: 'ASC',
            };

            await repository.findWithFilters(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'customer.state ILIKE :state',
                { state: '%Santa Fe%' }
            );
        });

        it('debe aplicar ordenamiento y paginación', async () => {
            const customers = [
                mockCustomer('c1'),
                mockCustomer('c2'),
                mockCustomer('c3'),
            ];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([customers, 15]);

            const filters: QueryCustomersDTO = {
                page: 2,
                limit: 10,
                sortBy: 'firstName',
                order: 'DESC',
            };

            await repository.findWithFilters(filters);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('customer.firstName', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (2-1) * 10
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('debe combinar múltiples filtros', async () => {
            const customers = [mockCustomer('c1')];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([customers, 1]);

            const filters: QueryCustomersDTO = {
                page: 1,
                limit: 10,
                search: 'Juan',
                categoryId: 'cat-1',
                isActive: true,
                city: 'Rosario',
                state: 'Santa Fe',
                sortBy: 'lastName',
                order: 'ASC',
            };

            await repository.findWithFilters(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(5); // search + category + isActive + city + state
        });

        it('debe retornar array vacío si no hay resultados', async () => {
            mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

            const filters: QueryCustomersDTO = {
                page: 1,
                limit: 10,
                sortBy: 'lastName',
                order: 'ASC',
            };

            const result = await repository.findWithFilters(filters);

            expect(result).toEqual([[], 0]);
        });
    });

    describe('findByDocumentNumber()', () => {
        it('debe buscar cliente por documento', async () => {
            const customer = mockCustomer('c1', { documentNumber: '12345678' });

            jest.spyOn(repository, 'findOne').mockResolvedValue(customer);

            const result = await repository.findByDocumentNumber('12345678');

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { documentNumber: '12345678' },
            });
            expect(result).toEqual(customer);
        });

        it('debe retornar null si no existe', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            const result = await repository.findByDocumentNumber('99999999');

            expect(result).toBeNull();
        });
    });

    describe('findByEmail()', () => {
        it('debe buscar cliente por email', async () => {
            const customer = mockCustomer('c1', { email: 'test@example.com' });

            jest.spyOn(repository, 'findOne').mockResolvedValue(customer);

            const result = await repository.findByEmail('test@example.com');

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(result).toEqual(customer);
        });

        it('debe retornar null si no existe', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            const result = await repository.findByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });
    });

    describe('findActiveCustomers()', () => {
        it('debe retornar activos con relaciones', async () => {
            const customers = [
                mockCustomer('c1', { isActive: true }),
                mockCustomer('c2', { isActive: true }),
            ];

            jest.spyOn(repository, 'find').mockResolvedValue(customers as any);

            const result = await repository.findActiveCustomers();

            expect(repository.find).toHaveBeenCalledWith({
                where: { isActive: true },
                relations: ['category'],
                order: { lastName: 'ASC', firstName: 'ASC' },
            });
            expect(result).toEqual(customers);
        });

        it('no debe incluir clientes inactivos', async () => {
            const customers = [mockCustomer('c1', { isActive: true })];

            jest.spyOn(repository, 'find').mockResolvedValue(customers as any);

            const result = await repository.findActiveCustomers();

            expect(result.every((c) => c.isActive === true)).toBe(true);
        });
    });

    describe('getCustomerStats()', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = createMockQueryBuilder();
            jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as never);
        });

        it('debe calcular estadísticas correctamente', async () => {
            jest.spyOn(repository, 'count').mockResolvedValue(100);
            jest.spyOn(repository, 'count').mockResolvedValueOnce(100).mockResolvedValueOnce(75);

            mockQueryBuilder.getRawMany.mockResolvedValue([
                { categoryName: 'VIP', count: '30' },
                { categoryName: 'Minorista', count: '45' },
                { categoryName: null, count: '25' },
            ]);

            const result = await repository.getCustomerStats();

            expect(repository.count).toHaveBeenCalledWith();
            expect(repository.count).toHaveBeenCalledWith({ where: { isActive: true } });
            expect(repository.createQueryBuilder).toHaveBeenCalledWith('customer');
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('customer.category', 'category');
            expect(mockQueryBuilder.select).toHaveBeenCalledWith('category.name', 'categoryName');
            expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('COUNT(customer.id)', 'count');
            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('category.name');
            expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();

            expect(result).toEqual({
                total: 100,
                active: 75,
                inactive: 25,
                byCategory: [
                    { categoryName: 'VIP', count: 30 },
                    { categoryName: 'Minorista', count: 45 },
                    { categoryName: 'Sin categoría', count: 25 },
                ],
            });
        });

        it('debe manejar categorías sin nombre (null)', async () => {
            jest.spyOn(repository, 'count').mockResolvedValue(50);
            jest.spyOn(repository, 'count').mockResolvedValueOnce(50).mockResolvedValueOnce(40);

            mockQueryBuilder.getRawMany.mockResolvedValue([
                { categoryName: null, count: '50' },
            ]);

            const result = await repository.getCustomerStats();

            expect(result.byCategory).toEqual([
                { categoryName: 'Sin categoría', count: 50 },
            ]);
        });

        it('debe manejar array vacío de categorías', async () => {
            jest.spyOn(repository, 'count').mockResolvedValue(0);
            jest.spyOn(repository, 'count').mockResolvedValueOnce(0).mockResolvedValueOnce(0);

            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            const result = await repository.getCustomerStats();

            expect(result).toEqual({
                total: 0,
                active: 0,
                inactive: 0,
                byCategory: [],
            });
        });
    });
});
