/**
 * Tests para InvoiceService
 * Cubre todos los métodos públicos y casos de uso importantes
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { InvoiceService } from './invoice.service';
import { Invoice, InvoiceType, InvoiceStatus, DocumentType } from '../entities/invoice.entity';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { AfipService } from './afip.service';
import { QrGeneratorService } from './qr-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ConfigService } from '@nestjs/config';
import { IvaCondition } from '../../../common/enums/iva-condition.enum';
import { createMockSaleWithRelations, createMockInvoice, TestConstants } from '../../../../test/helpers/sales.test-helpers';

describe('InvoiceService', () => {
    let service: InvoiceService;
    let invoiceRepo: jest.Mocked<Repository<Invoice>>;
    let saleRepo: jest.Mocked<Repository<Sale>>;
    let saleItemRepo: jest.Mocked<Repository<SaleItem>>;
    let afipService: jest.Mocked<AfipService>;
    let qrGeneratorService: jest.Mocked<QrGeneratorService>;
    let pdfGeneratorService: jest.Mocked<PdfGeneratorService>;
    let configService: jest.Mocked<ConfigService>;
    let dataSource: jest.Mocked<DataSource>;

    // Helpers para crear ventas con todas las relaciones
    const createSaleWithCustomerAndItems = (overrides: Partial<Sale> = {}): Sale => {
        return createMockSaleWithRelations({
            status: SaleStatus.COMPLETED,
            customerId: TestConstants.TEST_CUSTOMER_ID,
            customer: {
                id: TestConstants.TEST_CUSTOMER_ID,
                firstName: 'Juan',
                lastName: 'Pérez',
                documentType: 'DNI',
                documentNumber: '12345678',
                ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
                address: 'Av. Corrientes 1234',
                email: 'juan@example.com',
                phone: '11-1234-5678',
            } as any,
            items: [
                {
                    id: 'item-1',
                    productId: 'product-1',
                    productCode: 'SKU001',
                    productDescription: 'Producto Test',
                    quantity: 2,
                    unitPrice: 100,
                    discount: 0,
                    discountPercent: 0,
                    subtotal: 200,
                } as SaleItem,
            ],
            payments: [
                {
                    id: 'payment-1',
                    paymentMethodId: 'pm-1',
                    amount: 242,
                    paymentMethod: { id: 'pm-1', name: 'Efectivo' } as any,
                } as any,
            ],
            ...overrides,
        });
    };

    const createSaleWithRICustomer = (): Sale => {
        return createSaleWithCustomerAndItems({
            customerId: 'customer-ri',
            customer: {
                id: 'customer-ri',
                firstName: 'Empresa',
                lastName: 'S.A.',
                documentType: 'CUIT',
                documentNumber: '20123456789',
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                address: 'Av. Libertador 1000',
            } as any,
        });
    };

    beforeEach(async () => {
        // Crear mocks para todos los repositorios
        invoiceRepo = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
        } as unknown as jest.Mocked<Repository<Invoice>>;

        saleRepo = {
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
        } as unknown as jest.Mocked<Repository<Sale>>;

        saleItemRepo = {
            find: jest.fn(),
        } as unknown as jest.Mocked<Repository<SaleItem>>;

        afipService = {
            getConfiguration: jest.fn(),
            determineInvoiceType: jest.fn(),
            authorizeInvoice: jest.fn(),
            formatDateForAfip: jest.fn(),
            parseAfipDate: jest.fn(),
        } as unknown as jest.Mocked<AfipService>;

        qrGeneratorService = {
            generateQrData: jest.fn(),
        } as unknown as jest.Mocked<QrGeneratorService>;

        pdfGeneratorService = {
            generateInvoicePdf: jest.fn(),
            generateSaleNotePdf: jest.fn(),
        } as unknown as jest.Mocked<PdfGeneratorService>;

        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        dataSource = {
            createQueryRunner: jest.fn(),
        } as unknown as jest.Mocked<DataSource>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InvoiceService,
                { provide: 'InvoiceRepository', useValue: invoiceRepo },
                { provide: 'SaleRepository', useValue: saleRepo },
                { provide: 'SaleItemRepository', useValue: saleItemRepo },
                { provide: DataSource, useValue: dataSource },
                { provide: AfipService, useValue: afipService },
                { provide: QrGeneratorService, useValue: qrGeneratorService },
                { provide: PdfGeneratorService, useValue: pdfGeneratorService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<InvoiceService>(InvoiceService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateInvoice', () => {
        const mockAfipConfig = {
            cuit: '20123456789',
            businessName: 'Mi Negocio',
            businessAddress: 'Av. Corrientes 1234',
            ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            grossIncome: '901-123456-1',
            activityStartDate: new Date('2020-01-01'),
            pointOfSale: 1,
            environment: 'homologacion' as const,
        };

        const mockAfipResponse = {
            success: true,
            cae: '12345678901234',
            caeExpirationDate: '20250120',
            invoiceNumber: 1001,
        };

        beforeEach(() => {
            afipService.getConfiguration.mockResolvedValue(mockAfipConfig);
            afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_C);
            afipService.authorizeInvoice.mockResolvedValue(mockAfipResponse);
            afipService.formatDateForAfip.mockReturnValue('20250120');
            afipService.parseAfipDate.mockReturnValue(new Date('2025-01-30'));
            qrGeneratorService.generateQrData.mockReturnValue('qr-data-test');
        });

        it('debería generar una Factura C exitosamente para monotributo', async () => {
            const sale = createSaleWithCustomerAndItems({
                total: 242,
                subtotal: 242,
            });

            saleRepo.findOne.mockResolvedValue(sale);
            invoiceRepo.findOne.mockResolvedValue(null);

            const createdInvoice = createMockInvoice({
                saleId: sale.id,
                invoiceType: InvoiceType.FACTURA_C,
                status: InvoiceStatus.AUTHORIZED,
            });
            invoiceRepo.create.mockReturnValue(createdInvoice as any);
            invoiceRepo.save.mockResolvedValueOnce(createdInvoice as any).mockResolvedValueOnce({
                ...createdInvoice,
                status: InvoiceStatus.AUTHORIZED,
                cae: mockAfipResponse.cae,
            } as any);
            saleRepo.update.mockResolvedValue({ affected: 1 } as any);

            const result = await service.generateInvoice(sale.id);

            expect(invoiceRepo.create).toHaveBeenCalled();
            expect(afipService.determineInvoiceType).toHaveBeenCalled();
            expect(invoiceRepo.save).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('debería generar una Factura A para RI + RI', async () => {
            const sale = createSaleWithRICustomer();
            saleRepo.findOne.mockResolvedValue(sale);
            invoiceRepo.findOne.mockResolvedValue(null);

            afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_A);

            const createdInvoice = createMockInvoice({
                saleId: sale.id,
                invoiceType: InvoiceType.FACTURA_A,
                status: InvoiceStatus.AUTHORIZED,
            });
            invoiceRepo.create.mockReturnValue(createdInvoice as any);
            invoiceRepo.save.mockResolvedValueOnce(createdInvoice as any).mockResolvedValueOnce({
                ...createdInvoice,
                status: InvoiceStatus.AUTHORIZED,
                cae: mockAfipResponse.cae,
            } as any);
            saleRepo.update.mockResolvedValue({ affected: 1 } as any);

            const result = await service.generateInvoice(sale.id);

            expect(afipService.determineInvoiceType).toHaveBeenCalledWith('monotributo', 'responsable_inscripto');
            expect(result).toBeDefined();
        });

        it('debería lanzar NotFoundException si la venta no existe', async () => {
            saleRepo.findOne.mockResolvedValue(null);

            await expect(service.generateInvoice('non-existent-sale'))
                .rejects.toThrow(NotFoundException);
            await expect(service.generateInvoice('non-existent-sale'))
                .rejects.toThrow('Venta no encontrada');
        });

        it('debería lanzar BadRequestException si la venta ya tiene factura', async () => {
            const sale = createSaleWithCustomerAndItems();
            saleRepo.findOne.mockResolvedValue(sale);

            const existingInvoice = createMockInvoice({ saleId: sale.id });
            invoiceRepo.findOne.mockResolvedValue(existingInvoice as any);

            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow(BadRequestException);
            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow('ya tiene una factura asociada');
        });

        it('debería lanzar BadRequestException si la venta está cancelada', async () => {
            const sale = createSaleWithCustomerAndItems({
                status: SaleStatus.CANCELLED,
            });
            saleRepo.findOne.mockResolvedValue(sale);
            invoiceRepo.findOne.mockResolvedValue(null);

            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow(BadRequestException);
            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow('No se puede facturar una venta cancelada');
        });

        it('debería lanzar BadRequestException si AFIP no está configurado', async () => {
            const sale = createSaleWithCustomerAndItems();
            saleRepo.findOne.mockResolvedValue(sale);
            invoiceRepo.findOne.mockResolvedValue(null);
            afipService.getConfiguration.mockResolvedValue(null);

            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow(BadRequestException);
            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow('AFIP no está configurado');
        });

        it('debería lanzar BadRequestException si es Factura A y el cliente no tiene CUIT válido', async () => {
            const sale = createSaleWithCustomerAndItems({
                customer: {
                    id: 'customer-bad',
                    firstName: 'Cliente',
                    lastName: 'Sin CUIT',
                    documentType: 'DNI',
                    documentNumber: '12345678',
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                } as any,
            });
            saleRepo.findOne.mockResolvedValue(sale);
            invoiceRepo.findOne.mockResolvedValue(null);
            afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_A);

            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow(BadRequestException);
            await expect(service.generateInvoice(sale.id))
                .rejects.toThrow('debe tener CUIT válido');
        });

        it('debería manejar rechazo de AFIP correctamente', async () => {
            const sale = createSaleWithCustomerAndItems();
            saleRepo.findOne.mockResolvedValue(sale);
            invoiceRepo.findOne.mockResolvedValue(null);

            const createdInvoice = createMockInvoice({
                saleId: sale.id,
                status: InvoiceStatus.PENDING,
            });
            invoiceRepo.create.mockReturnValue(createdInvoice as any);
            invoiceRepo.save.mockResolvedValueOnce(createdInvoice as any).mockResolvedValueOnce({
                ...createdInvoice,
                status: InvoiceStatus.REJECTED,
                afipErrorMessage: 'Error validando datos',
            } as any);

            afipService.authorizeInvoice.mockResolvedValue({
                success: false,
                errors: ['Error validando datos'],
            });

            const result = await service.generateInvoice(sale.id);

            expect(result.status).toBe(InvoiceStatus.REJECTED);
            expect(result.afipErrorMessage).toContain('Error validando datos');
        });

        it('debería manejar error de comunicación con AFIP', async () => {
            const sale = createSaleWithCustomerAndItems();
            saleRepo.findOne.mockResolvedValue(sale);
            invoiceRepo.findOne.mockResolvedValue(null);

            const createdInvoice = createMockInvoice({
                saleId: sale.id,
                status: InvoiceStatus.PENDING,
            });
            invoiceRepo.create.mockReturnValue(createdInvoice as any);
            invoiceRepo.save.mockResolvedValueOnce(createdInvoice as any).mockResolvedValueOnce({
                ...createdInvoice,
                status: InvoiceStatus.ERROR,
                afipErrorMessage: 'Error de conexión',
            } as any);

            afipService.authorizeInvoice.mockRejectedValue(new Error('Error de conexión'));

            const result = await service.generateInvoice(sale.id);

            expect(result.status).toBe(InvoiceStatus.ERROR);
            expect(result.afipErrorMessage).toBe('Error de conexión');
        });

        it('debería usar manager si se proporciona (transacción)', async () => {
            const sale = createSaleWithCustomerAndItems();

            const mockManager = {
                getRepository: jest.fn().mockReturnValue({
                    findOne: jest.fn().mockResolvedValue(sale),
                    create: jest.fn().mockReturnValue(createMockInvoice()),
                    save: jest.fn().mockResolvedValue(createMockInvoice()),
                }),
            } as unknown as EntityManager;

            // El método findOne debe retornar null para existingInvoice
            (mockManager.getRepository as jest.Mock).mockImplementation((entity) => {
                if (entity === Invoice) {
                    return {
                        findOne: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockReturnValue(createMockInvoice()),
                        save: jest.fn().mockResolvedValue(createMockInvoice()),
                    };
                }
                return { findOne: jest.fn().mockResolvedValue(sale) };
            });

            // Mockear authorizeInvoice para que no falle
            afipService.authorizeInvoice.mockResolvedValue(mockAfipResponse);
            saleRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.generateInvoice(sale.id, mockManager);

            expect(mockManager.getRepository).toHaveBeenCalledWith(Sale);
            expect(mockManager.getRepository).toHaveBeenCalledWith(Invoice);
        });
    });

    describe('findOne', () => {
        it('debería encontrar una factura por ID', async () => {
            const invoice = createMockInvoice();
            invoiceRepo.findOne.mockResolvedValue(invoice as any);

            const result = await service.findOne(invoice.id);

            expect(result).toEqual(invoice);
            expect(invoiceRepo.findOne).toHaveBeenCalledWith({
                where: { id: invoice.id },
                relations: ['sale'],
            });
        });

        it('debería lanzar NotFoundException si no existe', async () => {
            invoiceRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent'))
                .rejects.toThrow(NotFoundException);
            await expect(service.findOne('non-existent'))
                .rejects.toThrow('Factura no encontrada');
        });
    });

    describe('findBySaleId', () => {
        it('debería encontrar factura por saleId', async () => {
            const saleId = TestConstants.TEST_SALE_ID;
            const invoice = createMockInvoice({ saleId });
            invoiceRepo.findOne.mockResolvedValue(invoice as any);

            const result = await service.findBySaleId(saleId);

            expect(result).toEqual(invoice);
            expect(invoiceRepo.findOne).toHaveBeenCalledWith({
                where: { saleId },
            });
        });

        it('debería retornar null si no hay factura para la venta', async () => {
            invoiceRepo.findOne.mockResolvedValue(null);

            const result = await service.findBySaleId('sale-without-invoice');

            expect(result).toBeNull();
        });
    });

    describe('generatePdf', () => {
        it('debería generar PDF de factura autorizada', async () => {
            const invoice = createMockInvoice({
                status: InvoiceStatus.AUTHORIZED,
                saleId: TestConstants.TEST_SALE_ID,
            });

            invoiceRepo.findOne.mockResolvedValue(invoice as any);

            const items = [
                {
                    id: 'item-1',
                    productDescription: 'Producto Test',
                    quantity: 2,
                    unitPrice: 100,
                    subtotal: 200,
                    product: { name: 'Producto' },
                } as any,
            ];
            saleItemRepo.find.mockResolvedValue(items);

            const pdfBuffer = Buffer.from('test-pdf-content');
            pdfGeneratorService.generateInvoicePdf.mockResolvedValue(pdfBuffer);

            const result = await service.generatePdf(invoice.id);

            expect(result).toEqual(pdfBuffer);
            expect(pdfGeneratorService.generateInvoicePdf).toHaveBeenCalledWith(invoice, items);
        });

        it('debería lanzar BadRequestException si factura no está autorizada', async () => {
            const invoice = createMockInvoice({
                status: InvoiceStatus.PENDING,
            });
            invoiceRepo.findOne.mockResolvedValue(invoice as any);

            await expect(service.generatePdf(invoice.id))
                .rejects.toThrow(BadRequestException);
            await expect(service.generatePdf(invoice.id))
                .rejects.toThrow('Solo se puede generar PDF de facturas autorizadas');
        });

        it('debería lanzar NotFoundException si factura no existe', async () => {
            invoiceRepo.findOne.mockResolvedValue(null);

            await expect(service.generatePdf('non-existent'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('retryAuthorization', () => {
        const mockAfipResponse = {
            success: true,
            cae: '98765432109876',
            caeExpirationDate: '20250201',
            invoiceNumber: 1002,
        };

        beforeEach(() => {
            afipService.authorizeInvoice.mockResolvedValue(mockAfipResponse);
            afipService.parseAfipDate.mockReturnValue(new Date('2025-02-10'));
            qrGeneratorService.generateQrData.mockReturnValue('new-qr-data');
        });

        it('debería reintentar y autorizar factura rechazada', async () => {
            const sale = createSaleWithRICustomer();
            const invoice = createMockInvoice({
                saleId: sale.id,
                status: InvoiceStatus.REJECTED,
                afipErrorMessage: 'CUIT inválido',
            });

            invoiceRepo.findOne.mockResolvedValueOnce(invoice as any); // para findOne
            saleRepo.findOne.mockResolvedValue(sale);

            const updatedInvoice = { ...invoice, status: InvoiceStatus.AUTHORIZED, cae: mockAfipResponse.cae };
            invoiceRepo.save.mockResolvedValue(updatedInvoice as any);
            saleRepo.update.mockResolvedValue({ affected: 1 } as any);

            const result = await service.retryAuthorization(invoice.id);

            expect(result.status).toBe(InvoiceStatus.AUTHORIZED);
            expect(result.cae).toBe(mockAfipResponse.cae);
            expect(saleRepo.update).toHaveBeenCalledWith(
                sale.id,
                expect.objectContaining({
                    isFiscal: true,
                    fiscalPending: false,
                    fiscalError: null,
                })
            );
        });

        it('debería lanzar BadRequestException si ya está autorizada', async () => {
            const invoice = createMockInvoice({
                status: InvoiceStatus.AUTHORIZED,
            });

            invoiceRepo.findOne.mockResolvedValue(invoice as any);

            await expect(service.retryAuthorization(invoice.id))
                .rejects.toThrow(BadRequestException);
            await expect(service.retryAuthorization(invoice.id))
                .rejects.toThrow('ya está autorizada');
        });

        it('debería actualizar datos del cliente desde BD al reintentar', async () => {
            const sale = createSaleWithRICustomer();
            // Actualizar el cliente simulando que se corrigió el CUIT
            const updatedSale = { ...sale };
            (updatedSale.customer as any).documentNumber = '20999888777';

            const invoice = createMockInvoice({
                saleId: sale.id,
                status: InvoiceStatus.REJECTED,
                receiverDocumentNumber: '20123456789', // CUIT antiguo
            });

            invoiceRepo.findOne.mockResolvedValueOnce(invoice as any);
            saleRepo.findOne.mockResolvedValue(updatedSale);

            const updatedInvoice = {
                ...invoice,
                status: InvoiceStatus.AUTHORIZED,
                receiverDocumentNumber: '20999888777', // CUIT actualizado
                cae: mockAfipResponse.cae,
            };
            invoiceRepo.save.mockResolvedValue(updatedInvoice as any);
            saleRepo.update.mockResolvedValue({ affected: 1 } as any);

            const result = await service.retryAuthorization(invoice.id);

            expect(result.receiverDocumentNumber).toBe('20999888777');
        });

        it('debería mantener estado REJECTED si AFIP rechaza nuevamente', async () => {
            const sale = createSaleWithRICustomer();
            const invoice = createMockInvoice({
                saleId: sale.id,
                status: InvoiceStatus.REJECTED,
            });

            invoiceRepo.findOne.mockResolvedValueOnce(invoice as any);
            saleRepo.findOne.mockResolvedValue(sale);

            afipService.authorizeInvoice.mockResolvedValue({
                success: false,
                errors: ['Error persistente'],
            });

            const updatedInvoice = { ...invoice, afipErrorMessage: 'Error persistente' };
            invoiceRepo.save.mockResolvedValue(updatedInvoice as any);

            const result = await service.retryAuthorization(invoice.id);

            expect(result.status).toBe(InvoiceStatus.REJECTED);
            expect(result.afipErrorMessage).toContain('Error persistente');
        });

        it('debería manejar errores de comunicación al reintentar', async () => {
            const sale = createSaleWithRICustomer();
            const invoice = createMockInvoice({
                saleId: sale.id,
                status: InvoiceStatus.ERROR,
            });

            invoiceRepo.findOne.mockResolvedValueOnce(invoice as any);
            saleRepo.findOne.mockResolvedValue(sale);

            afipService.authorizeInvoice.mockRejectedValue(new Error('Timeout'));

            const updatedInvoice = { ...invoice, status: InvoiceStatus.ERROR, afipErrorMessage: 'Timeout' };
            invoiceRepo.save.mockResolvedValue(updatedInvoice as any);

            const result = await service.retryAuthorization(invoice.id);

            expect(result.status).toBe(InvoiceStatus.ERROR);
            expect(result.afipErrorMessage).toBe('Timeout');
        });

        it('debería lanzar NotFoundException si la venta no existe', async () => {
            const invoice = createMockInvoice({
                saleId: 'non-existent-sale',
                status: InvoiceStatus.REJECTED, // Debe ser REJECTED para pasar la validación inicial
            });
            invoiceRepo.findOne.mockResolvedValueOnce(invoice as any);
            saleRepo.findOne.mockResolvedValue(null);

            await expect(service.retryAuthorization(invoice.id))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        const createMockQueryBuilder = () => {
            const qb: any = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn(),
            };
            return qb;
        };

        it('debería listar facturas con paginación', async () => {
            const invoices = [createMockInvoice(), createMockInvoice()];
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([invoices, 2]);
            invoiceRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAll({ page: 1, limit: 20 });

            expect(result.data).toEqual(invoices);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
            expect(result.totalPages).toBe(1);
        });

        it('debería filtrar por status', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            invoiceRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ status: InvoiceStatus.AUTHORIZED, page: 1, limit: 10 });

            expect(qb.andWhere).toHaveBeenCalledWith('invoice.status = :status', {
                status: InvoiceStatus.AUTHORIZED,
            });
        });

        it('debería filtrar por fecha desde (from)', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            invoiceRepo.createQueryBuilder.mockReturnValue(qb);

            const fromDate = new Date('2025-01-01');
            await service.findAll({ from: fromDate, page: 1, limit: 10 });

            expect(qb.andWhere).toHaveBeenCalledWith('invoice.issueDate >= :from', {
                from: fromDate,
            });
        });

        it('debería filtrar por fecha hasta (to)', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            invoiceRepo.createQueryBuilder.mockReturnValue(qb);

            const toDate = new Date('2025-01-31');
            await service.findAll({ to: toDate, page: 1, limit: 10 });

            expect(qb.andWhere).toHaveBeenCalledWith('invoice.issueDate <= :to', {
                to: toDate,
            });
        });

        it('debería calcular totalPages correctamente', async () => {
            const invoices = Array(25).fill(null).map(() => createMockInvoice());
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([invoices, 25]);
            invoiceRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.findAll({ page: 2, limit: 10 });

            expect(result.totalPages).toBe(3);
            expect(qb.skip).toHaveBeenCalledWith(10);
            expect(qb.take).toHaveBeenCalledWith(10);
        });

        it('debería ordenar por createdAt DESC', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            invoiceRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ page: 1, limit: 10 });

            expect(qb.orderBy).toHaveBeenCalledWith('invoice.createdAt', 'DESC');
        });

        it('debería hacer join con sale', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            invoiceRepo.createQueryBuilder.mockReturnValue(qb);

            await service.findAll({ page: 1, limit: 10 });

            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('invoice.sale', 'sale');
        });
    });

    describe('generateReceiptHtml', () => {
        it('debería generar HTML del recibo con cliente', async () => {
            const sale = createSaleWithCustomerAndItems({
                saleNumber: 'VENTA-2025-00001',
                saleDate: new Date('2025-01-15T14:30:00'),
                total: 242,
                subtotal: 242,
                discount: 0,
                tax: 0,
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            expect(result).toContain('COMPROBANTE DE VENTA');
            expect(result).toContain('VENTA-2025-00001');
            expect(result).toContain('Juan Pérez');
            expect(result).toContain('Producto Test');
            expect(result).toContain('242.00'); // total
        });

        it('debería generar HTML del recibo sin cliente (Consumidor Final)', async () => {
            const sale = createSaleWithCustomerAndItems({
                customer: null,
                customerId: null,
                customerName: 'Consumidor Final',
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            expect(result).toContain('Consumidor Final');
        });

        it('debería incluir descuento si existe', async () => {
            const sale = createSaleWithCustomerAndItems({
                discount: 20,
                total: 222,
                subtotal: 242,
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            expect(result).toContain('Descuento:');
            expect(result).toContain('20.00');
        });

        it('debería incluir impuestos/recargos si existen', async () => {
            const sale = createSaleWithCustomerAndItems({
                tax: 15,
                total: 257,
                subtotal: 242,
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            expect(result).toContain('Impuestos/Recargos:');
            expect(result).toContain('15.00');
        });

        it('debería incluir sección de pagos si existen', async () => {
            const sale = createSaleWithCustomerAndItems({
                payments: [
                    {
                        id: 'payment-1',
                        amount: 150,
                        paymentMethod: { id: 'pm-1', name: 'Efectivo' } as any,
                    } as any,
                    {
                        id: 'payment-2',
                        amount: 92,
                        paymentMethod: { id: 'pm-2', name: 'Tarjeta de Débito' } as any,
                    } as any,
                ],
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            expect(result).toContain('Forma de Pago');
            expect(result).toContain('Efectivo');
            expect(result).toContain('150.00');
            expect(result).toContain('Tarjeta de Débito');
            expect(result).toContain('92.00');
        });

        it('debería lanzar NotFoundException si la venta no existe', async () => {
            saleRepo.findOne.mockResolvedValue(null);

            await expect(service.generateReceiptHtml('non-existent'))
                .rejects.toThrow(NotFoundException);
        });

        it('debería renderizar múltiples items correctamente', async () => {
            const sale = createSaleWithCustomerAndItems({
                items: [
                    {
                        id: 'item-1',
                        productId: 'product-1',
                        productDescription: 'Producto A',
                        quantity: 2,
                        unitPrice: 100,
                        discount: 0,
                        subtotal: 200,
                    } as SaleItem,
                    {
                        id: 'item-2',
                        productId: 'product-2',
                        productDescription: 'Producto B',
                        quantity: 1,
                        unitPrice: 50,
                        discount: 0,
                        subtotal: 50,
                    } as SaleItem,
                ],
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            expect(result).toContain('Producto A');
            expect(result).toContain('Producto B');
            expect(result).toContain('2'); // cantidad de Producto A
            expect(result).toContain('100.00'); // precio unitario
        });

        it('debería formatear la fecha en locale es-AR', async () => {
            const sale = createSaleWithCustomerAndItems({
                saleDate: new Date('2025-01-15T14:30:00'),
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            // La fecha formateada en es-AR incluirá el nombre del mes en español
            expect(result).toMatch(/ene.*2025/); // enero, 2025
        });

        it('debería incluir documento del cliente si existe', async () => {
            const sale = createSaleWithCustomerAndItems({
                customer: {
                    id: TestConstants.TEST_CUSTOMER_ID,
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    documentType: 'DNI',
                    documentNumber: '12345678',
                    ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
                } as any,
            });

            saleRepo.findOne.mockResolvedValue(sale);

            const result = await service.generateReceiptHtml(sale.id);

            expect(result).toContain('DNI:');
            expect(result).toContain('12345678');
        });
    });

    describe('generateSaleNotePdf', () => {
        it('debería generar PDF de nota de venta', async () => {
            const sale = createSaleWithCustomerAndItems();
            const fiscalConfig = {
                cuit: '20123456789',
                businessName: 'Mi Negocio',
                businessAddress: 'Av. Corrientes 1234',
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                pointOfSale: 1,
                environment: 'homologacion' as const,
            };

            saleRepo.findOne.mockResolvedValue(sale);
            afipService.getConfiguration.mockResolvedValue(fiscalConfig);

            const pdfBuffer = Buffer.from('sale-note-pdf');
            pdfGeneratorService.generateSaleNotePdf.mockResolvedValue(pdfBuffer);

            const result = await service.generateSaleNotePdf(sale.id);

            expect(result).toEqual(pdfBuffer);
            expect(pdfGeneratorService.generateSaleNotePdf).toHaveBeenCalledWith(sale, fiscalConfig);
        });

        it('debería lanzar NotFoundException si la venta no existe', async () => {
            saleRepo.findOne.mockResolvedValue(null);

            await expect(service.generateSaleNotePdf('non-existent'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('Métodos privados - coverage mediante comportamiento observable', () => {
        describe('buildIvaArray (observable vía authorizeInvoice)', () => {
            const mockAfipConfig = {
                cuit: '20123456789',
                businessName: 'Mi Negocio',
                businessAddress: 'Av. Corrientes 1234',
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                pointOfSale: 1,
                environment: 'homologacion' as const,
            };

            it('debería construir array de IVA vacío para Factura C', async () => {
                const sale = createSaleWithCustomerAndItems();
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue(mockAfipConfig);
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_C);
                afipService.authorizeInvoice.mockResolvedValue({
                    success: true,
                    cae: '12345678901234',
                });

                const createdInvoice = createMockInvoice({ invoiceType: InvoiceType.FACTURA_C });
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const callArgs = afipService.authorizeInvoice.mock.calls[0][0];
                expect(callArgs.iva).toEqual([]); // Factura C no discrimina IVA
            });

            it('debería construir array con IVA 21%', async () => {
                const sale = createSaleWithRICustomer(); // Este cliente tiene CUIT válido
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue(mockAfipConfig);
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_A);
                afipService.authorizeInvoice.mockResolvedValue({
                    success: true,
                    cae: '12345678901234',
                });

                const createdInvoice = createMockInvoice({
                    invoiceType: InvoiceType.FACTURA_A,
                    iva21: 42,
                });
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const callArgs = afipService.authorizeInvoice.mock.calls[0][0];
                expect(callArgs.iva).toHaveLength(1);
                expect(callArgs.iva[0].id).toBe(5); // 21%
                expect(callArgs.iva[0].baseAmount).toBeGreaterThan(0);
                expect(callArgs.iva[0].amount).toBeGreaterThan(0);
            });
        });

        describe('calculateNetAmount y calculateIva21 (observable vía generación)', () => {
            it('debería calcular neto como total para Factura C', async () => {
                const sale = createSaleWithCustomerAndItems({ total: 242 });
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_C);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const createCall = invoiceRepo.create.mock.calls[0][0];
                expect(Number(createCall.netAmount)).toBe(242); // Para Factura C, neto = total
            });

            it('debería calcular neto sin IVA para Factura A', async () => {
                const sale = createSaleWithRICustomer(); // Cliente con CUIT válido para Factura A
                // Sobrescribir el total para probar el cálculo correcto
                (sale as any).total = 242;
                (sale as any).ivaPercentage = 21;
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_A);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const createCall = invoiceRepo.create.mock.calls[0][0];
                expect(Number(createCall.netAmount)).toBeCloseTo(200, 1); // 242 / 1.21 ≈ 200
                expect(Number(createCall.iva21)).toBeCloseTo(42, 1); // 242 - 200 = 42
            });
        });

        describe('getDocumentType (observable vía generación)', () => {
            it('debería mapear CUIT correctamente', async () => {
                const sale = createSaleWithCustomerAndItems({
                    customer: {
                        id: 'customer-1',
                        firstName: 'Empresa',
                        lastName: 'S.A.',
                        documentType: 'CUIT',
                        documentNumber: '20123456789',
                        ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    } as any,
                });
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_A);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const createCall = invoiceRepo.create.mock.calls[0][0];
                expect(createCall.receiverDocumentType).toBe(DocumentType.CUIT);
            });

            it('debería mapear DNI correctamente', async () => {
                const sale = createSaleWithCustomerAndItems({
                    customer: {
                        id: 'customer-1',
                        firstName: 'Juan',
                        lastName: 'Pérez',
                        documentType: 'DNI',
                        documentNumber: '12345678',
                        ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
                    } as any,
                });
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_B);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const createCall = invoiceRepo.create.mock.calls[0][0];
                expect(createCall.receiverDocumentType).toBe(DocumentType.DNI);
            });

            it('debería usar SIN_IDENTIFICAR (99) si no hay cliente', async () => {
                const sale = createSaleWithCustomerAndItems({
                    customer: null,
                    customerId: null,
                });
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_C);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const createCall = invoiceRepo.create.mock.calls[0][0];
                expect(createCall.receiverDocumentType).toBe(DocumentType.SIN_IDENTIFICAR);
            });
        });

        describe('getIvaConditionCode (observable vía authorizeInvoice)', () => {
            it('debería retornar 1 para RESPONSABLE_INSCRIPTO', async () => {
                const sale = createSaleWithRICustomer();
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_A);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const callArgs = afipService.authorizeInvoice.mock.calls[0][0];
                expect(callArgs.receiverIvaCondition).toBe(1);
            });

            it('debería retornar 6 para MONOTRIBUTO', async () => {
                const sale = createSaleWithCustomerAndItems({
                    customer: {
                        id: 'customer-1',
                        firstName: 'Juan',
                        lastName: 'Pérez',
                        documentType: 'DNI',
                        documentNumber: '12345678',
                        ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                    } as any,
                });
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_B);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const callArgs = afipService.authorizeInvoice.mock.calls[0][0];
                expect(callArgs.receiverIvaCondition).toBe(6);
            });

            it('debería retornar 5 para CONSUMIDOR_FINAL por defecto', async () => {
                const sale = createSaleWithCustomerAndItems({
                    customer: null,
                });
                saleRepo.findOne.mockResolvedValue(sale);
                invoiceRepo.findOne.mockResolvedValue(null);

                afipService.getConfiguration.mockResolvedValue({
                    cuit: '20123456789',
                    businessName: 'Mi Negocio',
                    businessAddress: 'Av. Corrientes 1234',
                    ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                    pointOfSale: 1,
                    environment: 'homologacion' as const,
                });
                afipService.determineInvoiceType.mockReturnValue(InvoiceType.FACTURA_C);
                afipService.authorizeInvoice.mockResolvedValue({ success: true, cae: '123' });

                const createdInvoice = createMockInvoice();
                invoiceRepo.create.mockReturnValue(createdInvoice as any);
                invoiceRepo.save.mockResolvedValue(createdInvoice as any);
                saleRepo.update.mockResolvedValue({ affected: 1 } as any);

                await service.generateInvoice(sale.id);

                const callArgs = afipService.authorizeInvoice.mock.calls[0][0];
                expect(callArgs.receiverIvaCondition).toBe(5);
            });
        });
    });
});
