/**
 * Tests unitarios para PaymentMethodsController
 * Cubre: findAll, seed
 * Enfoque: Pruebas de delegación al servicio
 */
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from '../services/payment-methods.service';
import { PaymentMethod } from '../entities/payment-method.entity';

describe('PaymentMethodsController', () => {
    let controller: PaymentMethodsController;
    let mockService: jest.Mocked<PaymentMethodsService>;

    const createMockPaymentMethod = (overrides = {}): PaymentMethod => ({
        id: 'method-uuid',
        name: 'Efectivo',
        code: 'cash',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    }) as PaymentMethod;

    beforeEach(() => {
        mockService = {
            findAll: jest.fn(),
            seed: jest.fn(),
        } as unknown as jest.Mocked<PaymentMethodsService>;

        controller = new PaymentMethodsController(mockService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll()', () => {
        it('debe retornar métodos de pago activos', async () => {
            const mockMethods = [
                createMockPaymentMethod({ name: 'Efectivo', code: 'cash' }),
                createMockPaymentMethod({ name: 'Transferencia', code: 'transfer' }),
                createMockPaymentMethod({ name: 'Cheque', code: 'check' }),
            ];

            mockService.findAll.mockResolvedValue(mockMethods as unknown as PaymentMethod[]);

            const result = await controller.findAll();

            expect(mockService.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockMethods);
            expect(result).toHaveLength(3);
        });

        it('debe retornar array vacío si no hay métodos', async () => {
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

    describe('seed()', () => {
        it('debe llamar al servicio de seed', async () => {
            const seedResult = { created: 3, updated: 0 };
            mockService.seed.mockResolvedValue(seedResult as never);

            const result = await controller.seed();

            expect(mockService.seed).toHaveBeenCalled();
            expect(result).toEqual(seedResult);
        });

        it('debe retornar conteo de métodos creados', async () => {
            const seedResult = { created: 5, updated: 0 };
            mockService.seed.mockResolvedValue(seedResult as never);

            const result = await controller.seed();

            expect(result.created).toBe(5);
        });

        it('debe propagar errores del servicio', async () => {
            const error = new Error('Seed failed');
            mockService.seed.mockRejectedValue(error);

            await expect(controller.seed()).rejects.toThrow(error);
        });
    });
});
