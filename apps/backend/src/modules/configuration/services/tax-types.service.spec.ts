/**
 * Tests unitarios para TaxTypesService
 * Cubre: findAll, create
 * Enfoque: Pruebas de comportamiento usando mocks de repositorio
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxType } from '../entities/tax-type.entity';
import { TaxTypesService } from './tax-types.service';
import { CreateTaxTypeDto } from '../dto/create-tax-type.dto';

describe('TaxTypesService', () => {
    let service: TaxTypesService;
    let mockRepo: jest.Mocked<Repository<TaxType>>;

    // Mock de TaxType
    const createMockTaxType = (overrides = {}): TaxType => ({
        id: 'tax-uuid',
        name: 'IVA 21%',
        percentage: 21,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    }) as TaxType;

    beforeEach(async () => {
        mockRepo = {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<Repository<TaxType>>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TaxTypesService,
                { provide: getRepositoryToken(TaxType), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<TaxTypesService>(TaxTypesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll()', () => {
        it('debe retornar tipos de impuesto activos ordenados por nombre', async () => {
            const mockTaxTypes = [
                createMockTaxType({ name: 'IVA 10.5%', percentage: 10.5 }),
                createMockTaxType({ name: 'IVA 21%', percentage: 21 }),
                createMockTaxType({ name: 'IVA 27%', percentage: 27 }),
            ];

            mockRepo.find.mockReturnValue({
                where: { isActive: true },
                order: { name: 'ASC' },
            } as any);
            mockRepo.find.mockResolvedValue(mockTaxTypes);

            const result = await service.findAll();

            expect(mockRepo.find).toHaveBeenCalledWith({
                where: { isActive: true },
                order: { name: 'ASC' },
            });
            expect(result).toEqual(mockTaxTypes);
        });

        it('debe retornar array vacío si no hay tipos de impuesto', async () => {
            mockRepo.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('create()', () => {
        it('debe crear nuevo tipo de impuesto con isActive true', async () => {
            const dto: CreateTaxTypeDto = {
                name: 'IVA 10.5%',
                percentage: 10.5,
            };

            const newTaxType = createMockTaxType({
                name: dto.name,
                percentage: dto.percentage,
                isActive: true,
            });

            mockRepo.create.mockReturnValue(newTaxType);
            mockRepo.save.mockResolvedValue(newTaxType);

            const result = await service.create(dto);

            expect(mockRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: dto.name,
                    percentage: dto.percentage,
                    isActive: true,
                })
            );
            expect(mockRepo.save).toHaveBeenCalledWith(newTaxType);
            expect(result).toEqual(newTaxType);
        });

        it('debe aceptar porcentaje decimal', async () => {
            const dto: CreateTaxTypeDto = {
                name: 'Impuesto Interno',
                percentage: 3.5,
            };

            const newTaxType = createMockTaxType({
                name: dto.name,
                percentage: dto.percentage,
                isActive: true,
            });

            mockRepo.create.mockReturnValue(newTaxType);
            mockRepo.save.mockResolvedValue(newTaxType);

            const result = await service.create(dto);

            expect(mockRepo.create).toHaveBeenCalled();
            expect(result.percentage).toBe(3.5);
        });

        it('debe propagar errores del repositorio', async () => {
            const dto: CreateTaxTypeDto = {
                name: 'IVA 21%',
                percentage: 21,
            };

            mockRepo.create.mockImplementation(() => {
                throw new Error('Database error');
            });

            await expect(service.create(dto)).rejects.toThrow('Database error');
        });
    });
});
