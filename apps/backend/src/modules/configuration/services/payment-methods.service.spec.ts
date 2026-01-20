/**
 * Tests unitarios para PaymentMethodsService
 * Cubre: findAll, seed, deactivateWalletMethod
 * Enfoque: Pruebas de comportamiento usando mocks de repositorio
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodsService } from './payment-methods.service';

describe('PaymentMethodsService', () => {
    let service: PaymentMethodsService;
    let mockRepo: jest.Mocked<Repository<PaymentMethod>>;

    // Mock de PaymentMethod
    const createMockPaymentMethod = (overrides = {}): PaymentMethod => ({
        id: 'method-uuid',
        name: 'Efectivo',
        code: 'cash',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    }) as PaymentMethod;

    beforeEach(async () => {
        mockRepo = {
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            update: jest.fn(),
        } as unknown as jest.Mocked<Repository<PaymentMethod>>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentMethodsService,
                { provide: getRepositoryToken(PaymentMethod), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<PaymentMethodsService>(PaymentMethodsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll()', () => {
        it('debe retornar métodos de pago activos ordenados por nombre', async () => {
            const mockMethods = [
                createMockPaymentMethod({ name: 'Billetera', code: 'qr', isActive: true }),
                createMockPaymentMethod({ name: 'Cheque', code: 'check', isActive: true }),
                createMockPaymentMethod({ name: 'Efectivo', code: 'cash', isActive: true }),
            ];

            mockRepo.find.mockResolvedValue(mockMethods as any);

            const result = await service.findAll();

            expect(mockRepo.find).toHaveBeenCalled();
            expect(result).toEqual(mockMethods);
        });

        it('debe retornar array vacío si no hay métodos', async () => {
            mockRepo.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('onModuleInit()', () => {
        it('debe ejecutar seed y deactivateWalletMethod al iniciar', async () => {
            const seedSpy = jest.spyOn(service as any, 'seed').mockResolvedValue({ created: 0 });
            const deactivateSpy = jest.spyOn(service as any, 'deactivateWalletMethod').mockResolvedValue(undefined);

            await service.onModuleInit();

            expect(seedSpy).toHaveBeenCalled();
            expect(deactivateSpy).toHaveBeenCalled();
        });
    });

    describe('deactivateWalletMethod()', () => {
        it('debe desactivar método wallet si está activo', async () => {
            const walletMethod = createMockPaymentMethod({
                code: 'wallet',
                isActive: true,
            });

            mockRepo.findOne.mockResolvedValue(walletMethod);
            mockRepo.save.mockResolvedValue(walletMethod);

            await (service as any).deactivateWalletMethod();

            expect(mockRepo.findOne).toHaveBeenCalledWith({
                where: { code: 'wallet' },
            });
            expect(mockRepo.save).toHaveBeenCalled();
        });

        it('no debe hacer nada si método wallet no existe', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await (service as any).deactivateWalletMethod();

            expect(mockRepo.findOne).toHaveBeenCalledWith({
                where: { code: 'wallet' },
            });
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('no debe hacer nada si método wallet ya está inactivo', async () => {
            const walletMethod = createMockPaymentMethod({
                code: 'wallet',
                isActive: false,
            });

            mockRepo.findOne.mockResolvedValue(walletMethod);

            await (service as any).deactivateWalletMethod();

            expect(mockRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('seed()', () => {
        it('debe retornar conteo de métodos creados', async () => {
            mockRepo.findOne.mockResolvedValue(null); // No existe ningún método
            mockRepo.save.mockResolvedValue(createMockPaymentMethod() as any);

            const result = await (service as any).seed();

            expect(result.created).toBeDefined();
            expect(mockRepo.findOne).toHaveBeenCalled();
        });

        it('debe no crear métodos si ya existen todos', async () => {
            mockRepo.findOne.mockResolvedValue(createMockPaymentMethod());

            const result = await (service as any).seed();

            expect(result.created).toBe(0);
        });
    });
});
