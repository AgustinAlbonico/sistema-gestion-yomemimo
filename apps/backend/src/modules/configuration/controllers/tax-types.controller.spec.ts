/**
 * Tests unitarios para TaxTypesController
 * Cubre: findAll, create
 * Enfoque: Pruebas de delegación al servicio
 */
import { TaxTypesController } from './tax-types.controller';
import { TaxTypesService } from '../services/tax-types.service';
import { TaxType } from '../entities/tax-type.entity';
import { CreateTaxTypeDto } from '../dto/create-tax-type.dto';

describe('TaxTypesController', () => {
    let controller: TaxTypesController;
    let mockService: jest.Mocked<TaxTypesService>;

    const createMockTaxType = (overrides = {}): TaxType => ({
        id: 'tax-uuid',
        name: 'IVA 21%',
        percentage: 21,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    }) as TaxType;

    beforeEach(() => {
        mockService = {
            findAll: jest.fn(),
            create: jest.fn(),
        } as unknown as jest.Mocked<TaxTypesService>;

        controller = new TaxTypesController(mockService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll()', () => {
        it('debe retornar tipos de impuesto activos', async () => {
            const mockTaxTypes = [
                createMockTaxType({ name: 'IVA 10.5%', percentage: 10.5 }),
                createMockTaxType({ name: 'IVA 21%', percentage: 21 }),
                createMockTaxType({ name: 'IVA 27%', percentage: 27 }),
            ];

            mockService.findAll.mockResolvedValue(mockTaxTypes as unknown as TaxType[]);

            const result = await controller.findAll();

            expect(mockService.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockTaxTypes);
            expect(result).toHaveLength(3);
        });

        it('debe retornar array vacío si no hay tipos de impuesto', async () => {
            mockService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(result).toEqual([]);
        });

        it('debe propagar errores del servicio', async () => {
            const error = new Error('Database error');
            mockService.findAll.mockRejectedValue(error);

            await expect(controller.findAll()).rejects.toThrow(error);
        });
    });

    describe('create()', () => {
        it('debe crear nuevo tipo de impuesto', async () => {
            const dto: CreateTaxTypeDto = {
                name: 'IVA 10.5%',
                percentage: 10.5,
            };

            const newTaxType = createMockTaxType({
                name: dto.name,
                percentage: dto.percentage,
            });

            mockService.create.mockResolvedValue(newTaxType as unknown as TaxType);

            const result = await controller.create(dto);

            expect(mockService.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(newTaxType);
        });

        it('debe crear tipo de impuesto con porcentaje entero', async () => {
            const dto: CreateTaxTypeDto = {
                name: 'IVA 21%',
                percentage: 21,
            };

            const newTaxType = createMockTaxType({
                name: dto.name,
                percentage: dto.percentage,
            });

            mockService.create.mockResolvedValue(newTaxType as unknown as TaxType);

            const result = await controller.create(dto);

            expect(mockService.create).toHaveBeenCalledWith(dto);
            expect(result.percentage).toBe(21);
        });

        it('debe crear tipo de impuesto con porcentaje decimal', async () => {
            const dto: CreateTaxTypeDto = {
                name: 'Impuesto Interno',
                percentage: 3.5,
            };

            const newTaxType = createMockTaxType({
                name: dto.name,
                percentage: dto.percentage,
            });

            mockService.create.mockResolvedValue(newTaxType as unknown as TaxType);

            const result = await controller.create(dto);

            expect(mockService.create).toHaveBeenCalledWith(dto);
            expect(result.percentage).toBe(3.5);
        });

        it('debe propagar errores del servicio', async () => {
            const dto: CreateTaxTypeDto = {
                name: 'IVA 21%',
                percentage: 21,
            };

            const error = new Error('Invalid tax type');
            mockService.create.mockRejectedValue(error);

            await expect(controller.create(dto)).rejects.toThrow(error);
        });
    });
});
