/**
 * Tests unitarios para CustomersController
 * Cubre: Todos los endpoints del controlador
 */
import { NotFoundException } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';
import { DocumentType } from './entities/customer.entity';
import { IvaCondition } from '../../common/enums/iva-condition.enum';

describe('CustomersController', () => {
    let controller: CustomersController;
    let service: jest.Mocked<CustomersService>;

    const mockCustomer = (id: string, overrides = {}) => ({
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
        notes: 'Cliente de prueba',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    beforeEach(() => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            getActiveCustomers: jest.fn(),
            getStats: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        } as unknown as jest.Mocked<CustomersService>;

        controller = new CustomersController(service);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create()', () => {
        const validDto: CreateCustomerDto = {
            firstName: 'Juan',
            lastName: 'Pérez',
            documentType: DocumentType.DNI,
            ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
            documentNumber: '12345678',
            email: 'juan@example.com',
            isActive: true,
        };

        it('debe crear cliente y retornarlo', async () => {
            const created = mockCustomer('cust-1');
            service.create.mockResolvedValue(created as any);

            const result = await controller.create(validDto);

            expect(service.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(created);
        });
    });

    describe('findAll()', () => {
        it('debe aplicar defaults y listar clientes', async () => {
            const query: QueryCustomersDto = {
                page: 1,
                limit: 10,
                sortBy: 'lastName',
                order: 'ASC',
            };
            const paginatedResult = {
                data: [mockCustomer('cust-1'), mockCustomer('cust-2')],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            };
            service.findAll.mockResolvedValue(paginatedResult as any);

            const result = await controller.findAll(query);

            expect(service.findAll).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                sortBy: 'lastName',
                order: 'ASC',
            });
            expect(result).toEqual(paginatedResult);
        });

        it('debe usar valores proporcionados en query', async () => {
            const query: QueryCustomersDto = {
                page: 2,
                limit: 20,
                sortBy: 'firstName' as any,
                order: 'DESC' as any,
                search: 'Juan',
                isActive: true,
            };
            const paginatedResult = {
                data: [],
                total: 0,
                page: 2,
                limit: 20,
                totalPages: 0,
            };
            service.findAll.mockResolvedValue(paginatedResult);

            const result = await controller.findAll(query);

            expect(service.findAll).toHaveBeenCalledWith({
                page: 2,
                limit: 20,
                sortBy: 'firstName',
                order: 'DESC',
                search: 'Juan',
                isActive: true,
            });
            expect(result).toEqual(paginatedResult);
        });
    });

    describe('getActiveCustomers()', () => {
        it('debe listar clientes activos', async () => {
            const activeCustomers = [
                mockCustomer('cust-1'),
                mockCustomer('cust-2'),
            ];
            service.getActiveCustomers.mockResolvedValue(activeCustomers as any);

            const result = await controller.getActiveCustomers();

            expect(service.getActiveCustomers).toHaveBeenCalled();
            expect(result).toEqual(activeCustomers);
        });
    });

    describe('getStats()', () => {
        it('debe retornar estadísticas', async () => {
            const stats = {
                total: 100,
                active: 85,
                inactive: 15,
                byCategory: {
                    VIP: 20,
                    Regular: 65,
                },
                newThisMonth: 5,
            };
            service.getStats.mockResolvedValue(stats as any);

            const result = await controller.getStats();

            expect(service.getStats).toHaveBeenCalled();
            expect(result).toEqual(stats);
        });
    });

    describe('findOne()', () => {
        it('debe retornar cliente por ID', async () => {
            const customer = mockCustomer('cust-1');
            service.findOne.mockResolvedValue(customer as any);

            const result = await controller.findOne('cust-1');

            expect(service.findOne).toHaveBeenCalledWith('cust-1');
            expect(result).toEqual(customer);
        });

        it('debe propagar NotFoundException si no existe', async () => {
            service.findOne.mockRejectedValue(new NotFoundException('Cliente no encontrado'));

            await expect(controller.findOne('nonexistent')).rejects.toThrow(
                NotFoundException
            );
        });
    });

    describe('update()', () => {
        it('debe actualizar cliente', async () => {
            const updateDto: UpdateCustomerDto = {
                firstName: 'Carlos',
            };
            const updated = mockCustomer('cust-1', { firstName: 'Carlos' });
            service.update.mockResolvedValue(updated as any);

            const result = await controller.update('cust-1', updateDto);

            expect(service.update).toHaveBeenCalledWith('cust-1', updateDto);
            expect(result).toEqual(updated);
        });
    });

    describe('remove()', () => {
        it('debe desactivar cliente', async () => {
            const result = { message: 'Cliente desactivado' };
            service.remove.mockResolvedValue(result);

            const response = await controller.remove('cust-1');

            expect(service.remove).toHaveBeenCalledWith('cust-1');
            expect(response).toEqual(result);
        });
    });
});
