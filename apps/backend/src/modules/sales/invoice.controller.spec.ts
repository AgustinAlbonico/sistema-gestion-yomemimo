/**
 * Tests para InvoiceController
 * Prueba los endpoints del controlador de facturas
 */
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { AfipService } from './services/afip.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoiceStatus } from './entities/invoice.entity';

describe('InvoiceController', () => {
    let controller: InvoiceController;
    let invoiceService: any;
    let afipService: any;

    beforeEach(async () => {
        const mockInvoiceService = {
            generateInvoice: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findBySaleId: jest.fn(),
            retryAuthorization: jest.fn(),
            generatePdf: jest.fn(),
            generateReceiptHtml: jest.fn(),
            generateSaleNotePdf: jest.fn(),
        };

        const mockAfipService = {
            testConnection: jest.fn(),
            getLastInvoiceNumber: jest.fn(),
            invalidateAuthToken: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InvoiceController],
            providers: [
                {
                    provide: InvoiceService,
                    useValue: mockInvoiceService,
                },
                {
                    provide: AfipService,
                    useValue: mockAfipService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<InvoiceController>(InvoiceController);
        invoiceService = mockInvoiceService;
        afipService = mockAfipService;
    });

    it('debería estar definido', () => {
        expect(controller).toBeDefined();
    });

    describe('POST /generate/:saleId', () => {
        it('debería generar factura para una venta', async () => {
            const mockInvoice = { id: 'invoice-123' };
            invoiceService.generateInvoice.mockResolvedValue(mockInvoice);

            const result = await controller.generateInvoice('sale-123');

            expect(invoiceService.generateInvoice).toHaveBeenCalledWith('sale-123');
            expect(result).toEqual(mockInvoice);
        });
    });

    describe('GET /', () => {
        it('debería listar facturas con filtros', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };
            invoiceService.findAll.mockResolvedValue(mockResult);

            const result = await controller.findAll(
                InvoiceStatus.AUTHORIZED,
                '2024-01-01',
                '2024-12-31',
                '1',
                '10'
            );

            expect(invoiceService.findAll).toHaveBeenCalledWith({
                status: InvoiceStatus.AUTHORIZED,
                from: new Date('2024-01-01'),
                to: new Date('2024-12-31'),
                page: 1,
                limit: 10,
            });
            expect(result).toEqual(mockResult);
        });

        it('debería funcionar sin filtros', async () => {
            const mockResult = { data: [] };
            invoiceService.findAll.mockResolvedValue(mockResult);

            await controller.findAll();

            expect(invoiceService.findAll).toHaveBeenCalledWith({});
        });
    });

    describe('GET /:id', () => {
        it('debería obtener factura por ID', async () => {
            const mockInvoice = { id: 'invoice-123' };
            invoiceService.findOne.mockResolvedValue(mockInvoice);

            const result = await controller.findOne('invoice-123');

            expect(invoiceService.findOne).toHaveBeenCalledWith('invoice-123');
            expect(result).toEqual(mockInvoice);
        });
    });

    describe('GET /sale/:saleId', () => {
        it('debería obtener factura por ID de venta', async () => {
            const mockInvoice = { id: 'invoice-123', saleId: 'sale-123' };
            invoiceService.findBySaleId.mockResolvedValue(mockInvoice);

            const result = await controller.findBySaleId('sale-123');

            expect(invoiceService.findBySaleId).toHaveBeenCalledWith('sale-123');
            expect(result).toEqual(mockInvoice);
        });

        it('debería retornar null si no hay factura', async () => {
            invoiceService.findBySaleId.mockResolvedValue(null);

            const result = await controller.findBySaleId('sale-123');

            expect(result).toBeNull();
        });
    });

    describe('POST /:id/retry', () => {
        it('debería reintentar autorización de factura', async () => {
            const mockInvoice = { id: 'invoice-123', status: InvoiceStatus.AUTHORIZED };
            invoiceService.retryAuthorization.mockResolvedValue(mockInvoice);

            const result = await controller.retryAuthorization('invoice-123');

            expect(invoiceService.retryAuthorization).toHaveBeenCalledWith('invoice-123');
            expect(result).toEqual(mockInvoice);
        });
    });

    describe('GET /:id/pdf', () => {
        it('debería descargar PDF de factura', async () => {
            const mockPdfBuffer = Buffer.from('mock-pdf');
            const mockInvoice = {
                id: 'invoice-123',
                pointOfSale: 1,
                invoiceNumber: 1001,
            };
            invoiceService.generatePdf.mockResolvedValue(mockPdfBuffer);
            invoiceService.findOne.mockResolvedValue(mockInvoice);

            const mockRes = {
                set: jest.fn(),
                end: jest.fn(),
            } as any;

            await controller.downloadPdf('invoice-123', mockRes);

            expect(invoiceService.generatePdf).toHaveBeenCalledWith('invoice-123');
            expect(invoiceService.findOne).toHaveBeenCalledWith('invoice-123');
            expect(mockRes.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': expect.stringContaining('filename='),
                    'Content-Length': expect.any(Number),
                })
            );
            expect(mockRes.end).toHaveBeenCalledWith(mockPdfBuffer);
        });
    });

    describe('GET /sale/:saleId/receipt', () => {
        it('debería retornar HTML del comprobante', async () => {
            const mockHtml = '<html>Receipt</html>';
            invoiceService.generateReceiptHtml.mockResolvedValue(mockHtml);

            const mockRes = {
                set: jest.fn(),
                send: jest.fn(),
            } as any;

            await controller.getReceipt('sale-123', mockRes);

            expect(invoiceService.generateReceiptHtml).toHaveBeenCalledWith('sale-123');
            expect(mockRes.set).toHaveBeenCalledWith({
                'Content-Type': 'text/html; charset=utf-8',
            });
            expect(mockRes.send).toHaveBeenCalledWith(mockHtml);
        });
    });

    describe('GET /sale/:saleId/note-pdf', () => {
        it('debería descargar PDF de nota de venta', async () => {
            const mockPdfBuffer = Buffer.from('mock-note-pdf');
            invoiceService.generateSaleNotePdf.mockResolvedValue(mockPdfBuffer);

            const mockRes = {
                set: jest.fn(),
                end: jest.fn(),
            } as any;

            await controller.downloadSaleNotePdf('sale-123', mockRes);

            expect(invoiceService.generateSaleNotePdf).toHaveBeenCalledWith('sale-123');
            expect(mockRes.set).toHaveBeenCalledWith({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="nota-venta-sale-123.pdf"',
                'Content-Length': mockPdfBuffer.length,
            });
            expect(mockRes.end).toHaveBeenCalledWith(mockPdfBuffer);
        });
    });

    describe('POST /afip/test-connection', () => {
        it('debería probar conexión con AFIP', async () => {
            const mockResult = { success: true, message: 'Conexión exitosa' };
            afipService.testConnection.mockResolvedValue(mockResult);

            const result = await controller.testAfipConnection();

            expect(afipService.testConnection).toHaveBeenCalled();
            expect(result).toEqual(mockResult);
        });

        it('debería retornar error cuando falla conexión', async () => {
            const mockResult = { success: false, message: 'Error de conexión' };
            afipService.testConnection.mockResolvedValue(mockResult);

            const result = await controller.testAfipConnection();

            expect(result.success).toBe(false);
        });
    });

    describe('POST /afip/clear-token', () => {
        it('debería limpiar token de AFIP', async () => {
            afipService.invalidateAuthToken.mockResolvedValue(undefined);

            const result = await controller.clearAfipToken();

            expect(afipService.invalidateAuthToken).toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                message: 'Token de AFIP limpiado. El próximo intento de facturación solicitará un nuevo token.',
            });
        });
    });

    describe('GET /afip/last-number', () => {
        it('debería consultar último número AFIP', async () => {
            afipService.getLastInvoiceNumber.mockResolvedValue(1001);

            const result = await controller.getLastAfipNumber('1', '11');

            expect(afipService.getLastInvoiceNumber).toHaveBeenCalledWith(1, 11);
            expect(result).toEqual({ lastNumber: 1001 });
        });
    });
});
