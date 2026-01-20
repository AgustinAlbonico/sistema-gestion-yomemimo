/**
 * Tests para QrGeneratorService
 * Prueba la generación de códigos QR según especificaciones de AFIP
 */
import { QrGeneratorService } from './qr-generator.service';
import { Invoice, InvoiceType, InvoiceStatus } from '../entities/invoice.entity';

// Mock del módulo qrcode
jest.mock('qrcode', () => ({
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-data'),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-qr-buffer')),
}));

import * as QRCode from 'qrcode';

describe('QrGeneratorService', () => {
    let service: QrGeneratorService;

    // Mock Invoice básico
    const mockInvoice: Invoice = {
        id: 'invoice-123',
        saleId: 'sale-123',
        invoiceType: InvoiceType.FACTURA_C,
        pointOfSale: 1,
        invoiceNumber: 1001,
        issueDate: new Date('2024-11-28'),
        emitterCuit: '20111222233',
        emitterBusinessName: 'Mi Negocio',
        emitterAddress: 'Av. Corrientes 1234',
        emitterIvaCondition: 'RESPONSABLE_MONOTRIBUTO',
        emitterGrossIncome: '901-123456-1',
        emitterActivityStartDate: new Date('2020-01-01'),
        receiverDocumentType: 99,
        receiverDocumentNumber: null,
        receiverName: 'Consumidor Final',
        receiverAddress: null,
        receiverIvaCondition: 'CONSUMIDOR_FINAL',
        subtotal: 1000,
        discount: 0,
        otherTaxes: 0,
        total: 1000,
        netAmount: 1000,
        iva21: 0,
        iva105: 0,
        iva27: 0,
        netAmountExempt: 0,
        saleCondition: 'Contado',
        status: InvoiceStatus.AUTHORIZED,
        cae: '12345678901234',
        caeExpirationDate: new Date('2024-12-31'),
        qrData: null,
        pdfPath: null,
        afipResponse: null,
        afipErrorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as unknown as Invoice;

    beforeEach(() => {
        service = new QrGeneratorService();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('debería crear una instancia de QrGeneratorService', () => {
            expect(service).toBeInstanceOf(QrGeneratorService);
        });
    });

    describe('generateQrData', () => {
        it('debería generar datos QR válidos para factura con CAE', () => {
            const result = service.generateQrData(mockInvoice);

            expect(result).toContain('https://www.afip.gob.ar/fe/qr/?p=');
        });

        it('debería incluir versión 1 en los datos QR', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.ver).toBe(1);
        });

        it('debería formatear fecha correctamente (YYYY-MM-DD)', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.fecha).toBe('2024-11-28');
        });

        it('debería incluir CUIT del emisor', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.cuit).toBe(20111222233);
        });

        it('debería incluir punto de venta', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.ptoVta).toBe(1);
        });

        it('debería incluir tipo de comprobante', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.tipoCmp).toBe(InvoiceType.FACTURA_C);
        });

        it('debería incluir número de comprobante', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.nroCmp).toBe(1001);
        });

        it('debería incluir importe total', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.importe).toBe(1000);
        });

        it('debería incluir moneda PES', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.moneda).toBe('PES');
        });

        it('debería incluir cotización 1', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.ctz).toBe(1);
        });

        it('debería incluir tipo de autorización "E" (CAE)', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.tipoCodAut).toBe('E');
        });

        it('debería incluir CAE', () => {
            const result = service.generateQrData(mockInvoice);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.codAut).toBe(12345678901234);
        });

        it('debería incluir datos del receptor cuando tiene documento tipo 80', () => {
            const invoiceWithReceiver = {
                ...mockInvoice,
                receiverDocumentType: 80,
                receiverDocumentNumber: '20111222233',
            };

            const result = service.generateQrData(invoiceWithReceiver);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.tipoDocRec).toBe(80);
            expect(qrData.nroDocRec).toBe(20111222233);
        });

        it('debería incluir datos del receptor cuando tiene documento tipo 96 (DNI)', () => {
            const invoiceWithReceiver = {
                ...mockInvoice,
                receiverDocumentType: 96,
                receiverDocumentNumber: '12345678',
            };

            const result = service.generateQrData(invoiceWithReceiver);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.tipoDocRec).toBe(96);
            expect(qrData.nroDocRec).toBe(12345678);
        });

        it('debería NO incluir datos del receptor cuando tipo es 99 (Sin Identificar)', () => {
            const invoiceType99 = {
                ...mockInvoice,
                receiverDocumentType: 99,
                receiverDocumentNumber: '0',
            };

            const result = service.generateQrData(invoiceType99);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.tipoDocRec).toBeUndefined();
            expect(qrData.nroDocRec).toBeUndefined();
        });

        it('debería NO incluir datos del receptor cuando no tiene número de documento', () => {
            const invoiceWithoutDoc = {
                ...mockInvoice,
                receiverDocumentType: 80,
                receiverDocumentNumber: null,
            };

            const result = service.generateQrData(invoiceWithoutDoc);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.tipoDocRec).toBeUndefined();
            expect(qrData.nroDocRec).toBeUndefined();
        });

        it('debería lanzar error cuando la factura no tiene CAE', () => {
            const invoiceWithoutCae = {
                ...mockInvoice,
                cae: null,
            };

            expect(() => service.generateQrData(invoiceWithoutCae)).toThrow(
                'La factura debe tener CAE y número asignado'
            );
        });

        it('debería lanzar error cuando la factura no tiene número', () => {
            const invoiceWithoutNumber = {
                ...mockInvoice,
                invoiceNumber: null,
            };

            expect(() => service.generateQrData(invoiceWithoutNumber)).toThrow(
                'La factura debe tener CAE y número asignado'
            );
        });

        it('debería manejar importes decimales correctamente', () => {
            const invoiceWithDecimal = {
                ...mockInvoice,
                total: 1234.56,
            };

            const result = service.generateQrData(invoiceWithDecimal);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.importe).toBe(1234.56);
        });

        it('debería formatear fecha con hora correctamente (solo YYYY-MM-DD)', () => {
            const invoiceWithTime = {
                ...mockInvoice,
                issueDate: new Date('2024-11-28T15:30:00Z'),
            };

            const result = service.generateQrData(invoiceWithTime);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            // Solo fecha, sin hora
            expect(qrData.fecha).toBe('2024-11-28');
        });
    });

    describe('generateQrImage', () => {
        it('debería generar imagen QR en formato Data URL', async () => {
            const result = await service.generateQrImage(mockInvoice);

            expect(result).toBe('data:image/png;base64,mock-qr-data');
        });

        it('debería llamar a QRCode.toDataURL con la URL generada', async () => {
            await service.generateQrImage(mockInvoice);

            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                expect.stringContaining('https://www.afip.gob.ar/fe/qr/?p='),
                expect.objectContaining({
                    width: 150,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                })
            );
        });

        it('debería propagar error de QRCode.toDataURL', async () => {
            (QRCode.toDataURL as jest.Mock).mockRejectedValueOnce(
                new Error('QR generation failed')
            );

            await expect(service.generateQrImage(mockInvoice)).rejects.toThrow(
                'QR generation failed'
            );
        });
    });

    describe('generateQrBuffer', () => {
        it('debería generar imagen QR como Buffer PNG', async () => {
            const result = await service.generateQrBuffer(mockInvoice);

            expect(result).toEqual(Buffer.from('mock-qr-buffer'));
        });

        it('debería llamar a QRCode.toBuffer con la URL generada', async () => {
            await service.generateQrBuffer(mockInvoice);

            expect(QRCode.toBuffer).toHaveBeenCalledWith(
                expect.stringContaining('https://www.afip.gob.ar/fe/qr/?p='),
                expect.objectContaining({
                    width: 150,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                })
            );
        });

        it('debería propagar error de QRCode.toBuffer', async () => {
            (QRCode.toBuffer as jest.Mock).mockRejectedValueOnce(
                new Error('Buffer generation failed')
            );

            await expect(service.generateQrBuffer(mockInvoice)).rejects.toThrow(
                'Buffer generation failed'
            );
        });
    });

    describe('formatDate (método privado, testeado indirectamente)', () => {
        it('debería formatear fecha a ISO sin hora', () => {
            const invoiceWithSpecificDate = {
                ...mockInvoice,
                issueDate: new Date('2024-12-25T10:30:45Z'),
            };

            const result = service.generateQrData(invoiceWithSpecificDate);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            // toISOString().slice(0, 10) devuelve YYYY-MM-DD
            expect(qrData.fecha).toBe('2024-12-25');
        });

        it('debería formatear fecha con un solo dígito en mes y día', () => {
            const invoiceEarlyYear = {
                ...mockInvoice,
                issueDate: new Date('2024-01-05T00:00:00Z'),
            };

            const result = service.generateQrData(invoiceEarlyYear);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.fecha).toBe('2024-01-05');
        });

        it('debería formatear fecha fin de mes', () => {
            const invoiceEndMonth = {
                ...mockInvoice,
                issueDate: new Date('2024-12-31T23:59:59Z'),
            };

            const result = service.generateQrData(invoiceEndMonth);
            const base64Data = result.split('?p=')[1];
            const decoded = Buffer.from(base64Data, 'base64').toString();
            const qrData = JSON.parse(decoded);

            expect(qrData.fecha).toBe('2024-12-31');
        });
    });
});
