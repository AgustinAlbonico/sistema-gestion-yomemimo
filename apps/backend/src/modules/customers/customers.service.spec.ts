/**
 * Tests unitarios para CustomersService
 * Cubre: CRUD completo de clientes con validaciones de negocio
 */
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';
import { CustomerCategoriesRepository } from './customer-categories.repository';
import { FiscalConfigurationService } from '../configuration/fiscal-configuration.service';
import { Customer, DocumentType } from './entities/customer.entity';
import { QueryCustomersDto, CreateCustomerDto, UpdateCustomerDto } from './dto';
import { IvaCondition } from '../../common/enums/iva-condition.enum';

describe('CustomersService', () => {
    let service: CustomersService;
    let customersRepository: jest.Mocked<CustomersRepository>;
    let categoriesRepository: jest.Mocked<CustomerCategoriesRepository>;
    let fiscalConfigService: jest.Mocked<FiscalConfigurationService>;

    const validDto: CreateCustomerDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: DocumentType.DNI,
        ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
        documentNumber: '12345678',
        email: 'juan.perez@example.com',
        phone: '11-1234-5678',
        mobile: '11-9876-5432',
        address: 'Calle Test 123',
        city: 'Buenos Aires',
        state: 'B',
        postalCode: '1234',
        categoryId: 'cat-1',
        notes: 'Cliente de prueba',
        isActive: true,
    };

    // DTO sin categoría para tests de validación fiscal
    const validDtoSinCategoria: CreateCustomerDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: DocumentType.DNI,
        ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
        documentNumber: '12345678',
        email: 'juan.perez@example.com',
        phone: '11-1234-5678',
        mobile: '11-9876-5432',
        address: 'Calle Test 123',
        city: 'Buenos Aires',
        state: 'B',
        postalCode: '1234',
        notes: 'Cliente de prueba',
        isActive: true,
    };

    const mockCustomer = (id: string, overrides: Partial<Customer> = {}): Customer => ({
        id,
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: DocumentType.DNI,
        ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
        documentNumber: '12345678',
        email: 'juan.perez@example.com',
        phone: '11-1234-5678',
        mobile: '11-9876-5432',
        address: 'Calle Test 123',
        city: 'Buenos Aires',
        state: 'B',
        postalCode: '1234',
        categoryId: 'cat-1',
        notes: 'Cliente de prueba',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: null,
        ...overrides,
    } as unknown as Customer);

    beforeEach(() => {
        // Mock de las dependencias
        customersRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            softDelete: jest.fn(),
            findByDocumentNumber: jest.fn(),
            findByEmail: jest.fn(),
            findActiveCustomers: jest.fn(),
            findWithFilters: jest.fn(),
            getCustomerStats: jest.fn(),
        } as unknown as jest.Mocked<CustomersRepository>;

        categoriesRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
        } as unknown as jest.Mocked<CustomerCategoriesRepository>;

        fiscalConfigService = {
            getPublicConfiguration: jest.fn(),
        } as unknown as jest.Mocked<FiscalConfigurationService>;

        // Crear el servicio manualmente con los mocks
        service = new CustomersService(
            customersRepository,
            categoriesRepository,
            fiscalConfigService,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create()', () => {
        it('debe crear cliente con datos válidos', async () => {
            const customer = mockCustomer('customer-1');
            categoriesRepository.findOne.mockResolvedValue({
                id: 'cat-1',
                name: 'VIP',
            } as never);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            customersRepository.create.mockReturnValue(customer);
            customersRepository.save.mockResolvedValue(customer);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
            } as never);

            const result = await service.create(validDto);

            expect(categoriesRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
            });
            expect(customersRepository.create).toHaveBeenCalled();
            expect(customersRepository.save).toHaveBeenCalled();
            expect(result).toEqual(customer);
        });

        it('debe lanzar ConflictException si documento ya existe', async () => {
            categoriesRepository.findOne.mockResolvedValue({
                id: 'cat-1',
                name: 'VIP',
            } as never);
            customersRepository.findByDocumentNumber.mockResolvedValue(mockCustomer('existing'));
            customersRepository.findByEmail.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            await expect(service.create(validDto)).rejects.toThrow(
                new ConflictException('El número de documento ya está registrado')
            );
        });

        it('debe lanzar ConflictException si email ya existe', async () => {
            categoriesRepository.findOne.mockResolvedValue({
                id: 'cat-1',
                name: 'VIP',
            } as never);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(mockCustomer('existing'));
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            await expect(service.create(validDto)).rejects.toThrow(
                new ConflictException('El email ya está registrado')
            );
        });

        it('debe lanzar NotFoundException si categoría no existe', async () => {
            const dtoWithInvalidCategory = { ...validDto, categoryId: 'invalid-cat' };
            categoriesRepository.findOne.mockResolvedValue(null);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            await expect(service.create(dtoWithInvalidCategory)).rejects.toThrow(
                new NotFoundException('Categoría no encontrada')
            );
        });

        it('debe limpiar campos vacíos (null/string vacío) antes de guardar', async () => {
            const dtoWithEmptyFields = {
                ...validDto,
                email: '  ',
                phone: '',
                mobile: null,
                address: undefined,
                categoryId: '',
            };
            const customer = mockCustomer('customer-1');
            categoriesRepository.findOne.mockResolvedValue(null);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            customersRepository.create.mockReturnValue(customer);
            customersRepository.save.mockResolvedValue(customer);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            await service.create(dtoWithEmptyFields as any);

            expect(customersRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: null,
                    phone: null,
                    mobile: null,
                    address: null,
                    categoryId: null,
                })
            );
        });

        describe('validación fiscal CUIT/RI', () => {
            const riEmisorConfig = {
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
            } as never;

            it('debe permitir cliente RI sin CUIT cuando emisor no es RI', async () => {
                const dtoRI = {
                    ...validDtoSinCategoria,
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    documentType: DocumentType.DNI,
                    documentNumber: '12345678',
                };
                const customer = mockCustomer('customer-1');

                categoriesRepository.findOne.mockResolvedValue(null);
                customersRepository.findByDocumentNumber.mockResolvedValue(null);
                customersRepository.findByEmail.mockResolvedValue(null);
                customersRepository.create.mockReturnValue(customer);
                customersRepository.save.mockResolvedValue(customer);
                fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                    ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                } as never);

                const result = await service.create(dtoRI);

                expect(result).toEqual(customer);
            });

            it('debe lanzar BadRequestException si cliente es RI sin CUIT (emisor también RI)', async () => {
                const dtoRI = {
                    ...validDtoSinCategoria,
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    documentType: DocumentType.DNI,
                    documentNumber: '12345678',
                };

                categoriesRepository.findOne.mockResolvedValue(null);
                customersRepository.findByDocumentNumber.mockResolvedValue(null);
                customersRepository.findByEmail.mockResolvedValue(null);
                fiscalConfigService.getPublicConfiguration.mockResolvedValue(riEmisorConfig);

                await expect(service.create(dtoRI)).rejects.toThrow(
                    new BadRequestException(
                        'Para clientes Responsable Inscripto, el CUIT es obligatorio (11 dígitos). ' +
                        'Este dato es requerido por AFIP para emitir Factura A.'
                    )
                );
            });

            it('debe lanzar BadRequestException si cliente es RI con CUIT inválido (< 11 dígitos)', async () => {
                const dtoRI = {
                    ...validDtoSinCategoria,
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    documentType: DocumentType.CUIT,
                    documentNumber: '12345678', // 8 dígitos, inválido
                };

                categoriesRepository.findOne.mockResolvedValue(null);
                customersRepository.findByDocumentNumber.mockResolvedValue(null);
                customersRepository.findByEmail.mockResolvedValue(null);
                fiscalConfigService.getPublicConfiguration.mockResolvedValue(riEmisorConfig);

                await expect(service.create(dtoRI)).rejects.toThrow(
                    new BadRequestException(
                        'Para clientes Responsable Inscripto, el CUIT es obligatorio (11 dígitos). ' +
                        'Este dato es requerido por AFIP para emitir Factura A.'
                    )
                );
            });

            it('debe permitir cliente RI con CUIT válido de 11 dígitos', async () => {
                const dtoRI = {
                    ...validDtoSinCategoria,
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    documentType: DocumentType.CUIT,
                    documentNumber: '20123456789', // 11 dígitos
                };
                const customer = mockCustomer('customer-1');

                categoriesRepository.findOne.mockResolvedValue(null);
                customersRepository.findByDocumentNumber.mockResolvedValue(null);
                customersRepository.findByEmail.mockResolvedValue(null);
                customersRepository.create.mockReturnValue(customer);
                customersRepository.save.mockResolvedValue(customer);
                fiscalConfigService.getPublicConfiguration.mockResolvedValue(riEmisorConfig);

                const result = await service.create(dtoRI);

                expect(result).toEqual(customer);
            });

            it('debe permitir cliente no RI sin CUIT', async () => {
                const dtoCF = {
                    ...validDtoSinCategoria,
                    ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
                    documentType: null,
                    documentNumber: null,
                } as any;
                const customer = mockCustomer('customer-1');

                categoriesRepository.findOne.mockResolvedValue(null);
                customersRepository.findByDocumentNumber.mockResolvedValue(null);
                customersRepository.findByEmail.mockResolvedValue(null);
                customersRepository.create.mockReturnValue(customer);
                customersRepository.save.mockResolvedValue(customer);
                fiscalConfigService.getPublicConfiguration.mockResolvedValue(riEmisorConfig);

                const result = await service.create(dtoCF);

                expect(result).toEqual(customer);
            });
        });
    });

    describe('findAll()', () => {
        const mockCustomers = [
            mockCustomer('customer-1', { firstName: 'Juan', lastName: 'Pérez' }),
            mockCustomer('customer-2', { firstName: 'María', lastName: 'Gómez' }),
        ];

        it('debe listar clientes con paginación', async () => {
            customersRepository.findWithFilters.mockResolvedValue([
                mockCustomers,
                2,
            ]);

            const filters: QueryCustomersDto = {
                page: 1,
                limit: 10,
                search: 'Juan',
                sortBy: 'lastName',
                order: 'ASC',
            };

            const result = await service.findAll(filters);

            expect(customersRepository.findWithFilters).toHaveBeenCalledWith(filters);
            expect(result.data).toEqual(mockCustomers);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
        });

        it('debe calcular totalPages correctamente cuando hay más resultados', async () => {
            customersRepository.findWithFilters.mockResolvedValue([
                mockCustomers,
                25,
            ]);

            const filters: QueryCustomersDto = {
                page: 1,
                limit: 10,
                sortBy: 'lastName',
                order: 'ASC',
            };

            const result = await service.findAll(filters);

            expect(result.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
        });
    });

    describe('findOne()', () => {
        it('debe obtener cliente por ID', async () => {
            const customer = mockCustomer('customer-1', {
                category: { id: 'cat-1', name: 'VIP' } as never,
            });

            customersRepository.findOne.mockResolvedValue(customer);

            const result = await service.findOne('customer-1');

            expect(customersRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'customer-1' },
                relations: ['category'],
            });
            expect(result).toEqual(customer);
        });

        it('debe lanzar NotFoundException si cliente no existe', async () => {
            customersRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(
                new NotFoundException('Cliente no encontrado')
            );
        });
    });

    describe('update()', () => {
        it('debe actualizar cliente exitosamente', async () => {
            const existingCustomer = mockCustomer('customer-1');
            const updatedCustomer = mockCustomer('customer-1', {
                firstName: 'Carlos',
                lastName: 'López',
            });

            const updateDto: UpdateCustomerDto = {
                firstName: 'Carlos',
                lastName: 'López',
            };

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            customersRepository.save.mockResolvedValue(updatedCustomer);
            categoriesRepository.findOne.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            const result = await service.update('customer-1', updateDto);

            expect(customersRepository.save).toHaveBeenCalled();
            expect(result).toEqual(updatedCustomer);
        });

        it('debe lanzar ConflictException si documento duplicado en update', async () => {
            const existingCustomer = mockCustomer('customer-1', {
                documentNumber: '11111111',
            });
            const anotherCustomer = mockCustomer('customer-2', {
                documentNumber: '22222222',
            });

            const updateDto: UpdateCustomerDto = {
                documentNumber: '22222222',
            };

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.findByDocumentNumber.mockResolvedValue(anotherCustomer);
            categoriesRepository.findOne.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            await expect(service.update('customer-1', updateDto)).rejects.toThrow(
                new ConflictException('El número de documento ya está registrado')
            );
        });

        it('debe permitir actualizar con mismo documento', async () => {
            const existingCustomer = mockCustomer('customer-1', {
                documentNumber: '12345678',
            });

            const updateDto: UpdateCustomerDto = {
                documentNumber: '12345678', // Mismo valor
                firstName: 'Carlos',
            };

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            customersRepository.save.mockResolvedValue(existingCustomer);
            categoriesRepository.findOne.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            const result = await service.update('customer-1', updateDto);

            expect(customersRepository.save).toHaveBeenCalled();
            expect(result).toEqual(existingCustomer);
        });

        it('debe lanzar ConflictException si email duplicado en update', async () => {
            const existingCustomer = mockCustomer('customer-1', {
                email: 'old@example.com',
            });
            const anotherCustomer = mockCustomer('customer-2', {
                email: 'new@example.com',
            });

            const updateDto: UpdateCustomerDto = {
                email: 'new@example.com',
            };

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(anotherCustomer);
            categoriesRepository.findOne.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            await expect(service.update('customer-1', updateDto)).rejects.toThrow(
                new ConflictException('El email ya está registrado')
            );
        });

        it('debe lanzar NotFoundException si categoría no existe en update', async () => {
            const existingCustomer = mockCustomer('customer-1');

            const updateDto: UpdateCustomerDto = {
                categoryId: 'invalid-cat',
            };

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            categoriesRepository.findOne.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            await expect(service.update('customer-1', updateDto)).rejects.toThrow(
                new NotFoundException('Categoría no encontrada')
            );
        });

        it('debe validar CUIT si cambia condición IVA a RI en update', async () => {
            const existingCustomer = mockCustomer('customer-1', {
                ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
                documentType: DocumentType.DNI,
                documentNumber: '12345678',
            });

            const updateDto: UpdateCustomerDto = {
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                documentType: DocumentType.CUIT,
                documentNumber: '123', // CUIT inválido
            };

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            categoriesRepository.findOne.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
            } as never);

            await expect(service.update('customer-1', updateDto)).rejects.toThrow(
                new BadRequestException(
                    'Para clientes Responsable Inscripto, el CUIT es obligatorio (11 dígitos). ' +
                    'Este dato es requerido por AFIP para emitir Factura A.'
                )
            );
        });

        it('debe actualizar solo campos proporcionados', async () => {
            const existingCustomer = mockCustomer('customer-1', {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan@example.com',
            });
            const updatedCustomer = mockCustomer('customer-1', {
                firstName: 'Carlos',
                lastName: 'Pérez',
                email: 'juan@example.com',
            });

            const updateDto: UpdateCustomerDto = {
                firstName: 'Carlos',
                // Solo actualizar firstName
            };

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.findByDocumentNumber.mockResolvedValue(null);
            customersRepository.findByEmail.mockResolvedValue(null);
            customersRepository.save.mockResolvedValue(updatedCustomer);
            categoriesRepository.findOne.mockResolvedValue(null);
            fiscalConfigService.getPublicConfiguration.mockResolvedValue({
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            } as never);

            const result = await service.update('customer-1', updateDto);

            expect(customersRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    firstName: 'Carlos',
                    lastName: 'Pérez', // No cambia
                    email: 'juan@example.com', // No cambia
                })
            );
            expect(result).toEqual(updatedCustomer);
        });
    });

    describe('remove()', () => {
        it('debe desactivar cliente (soft delete)', async () => {
            const existingCustomer = mockCustomer('customer-1', {
                isActive: true,
            });
            const deactivatedCustomer = mockCustomer('customer-1', {
                isActive: false,
            });

            customersRepository.findOne.mockResolvedValue(existingCustomer);
            customersRepository.save.mockResolvedValue(deactivatedCustomer);

            const result = await service.remove('customer-1');

            expect(customersRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'customer-1' },
                relations: ['category'],
            });
            expect(customersRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ isActive: false })
            );
            expect(result).toEqual({ message: 'Cliente desactivado exitosamente' });
        });

        it('debe lanzar NotFoundException si cliente no existe al eliminar', async () => {
            customersRepository.findOne.mockResolvedValue(null);

            await expect(service.remove('nonexistent')).rejects.toThrow(
                new NotFoundException('Cliente no encontrado')
            );
        });
    });

    describe('getActiveCustomers()', () => {
        it('debe retornar clientes activos', async () => {
            const activeCustomers = [
                mockCustomer('customer-1', { isActive: true }),
                mockCustomer('customer-2', { isActive: true }),
            ];

            customersRepository.findActiveCustomers.mockResolvedValue(activeCustomers);

            const result = await service.getActiveCustomers();

            expect(customersRepository.findActiveCustomers).toHaveBeenCalled();
            expect(result).toEqual(activeCustomers);
            expect(result).toHaveLength(2);
        });
    });

    describe('getStats()', () => {
        it('debe retornar estadísticas completas', async () => {
            const mockStats = {
                total: 100,
                active: 75,
                inactive: 25,
                byCategory: [
                    { categoryName: 'VIP', count: 30 },
                    { categoryName: 'Minorista', count: 45 },
                    { categoryName: 'Sin categoría', count: 25 },
                ],
            };

            customersRepository.getCustomerStats.mockResolvedValue(mockStats);

            const result = await service.getStats();

            expect(customersRepository.getCustomerStats).toHaveBeenCalled();
            expect(result).toEqual(mockStats);
            expect(result.total).toBe(100);
            expect(result.active).toBe(75);
            expect(result.inactive).toBe(25);
            expect(result.byCategory).toHaveLength(3);
        });
    });
});
