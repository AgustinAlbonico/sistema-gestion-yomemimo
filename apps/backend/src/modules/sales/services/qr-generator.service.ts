/**
 * Servicio de generación de QR para facturas
 * Genera el código QR según especificaciones de AFIP
 * 
 * Referencia: https://www.afip.gob.ar/fe/qr/documentos/QRespecificaciones.pdf
 */
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { Invoice } from '../entities/invoice.entity';

/**
 * Datos del QR según especificación AFIP
 */
interface QrDataAfip {
    ver: number;           // Versión (siempre 1)
    fecha: string;         // Fecha emisión (YYYY-MM-DD)
    cuit: number;          // CUIT emisor (11 dígitos)
    ptoVta: number;        // Punto de venta
    tipoCmp: number;       // Tipo de comprobante
    nroCmp: number;        // Número de comprobante
    importe: number;       // Importe total
    moneda: string;        // Moneda (PES, DOL, etc.)
    ctz: number;           // Cotización
    tipoDocRec?: number;   // Tipo documento receptor
    nroDocRec?: number;    // Número documento receptor
    tipoCodAut: string;    // "E" para CAE
    codAut: number;        // Código de autorización (CAE)
}

@Injectable()
export class QrGeneratorService {
    /**
     * Genera los datos del QR en formato JSON Base64 según especificación AFIP
     * @param invoice - Factura con CAE autorizado
     * @returns URL completa para el QR de AFIP
     */
    generateQrData(invoice: Invoice): string {
        if (!invoice.cae || !invoice.invoiceNumber) {
            throw new Error('La factura debe tener CAE y número asignado');
        }

        const qrData: QrDataAfip = {
            ver: 1,
            fecha: this.formatDate(invoice.issueDate),
            cuit: Number.parseInt(invoice.emitterCuit),
            ptoVta: invoice.pointOfSale,
            tipoCmp: invoice.invoiceType,
            nroCmp: invoice.invoiceNumber,
            importe: Number(invoice.total),
            moneda: 'PES',
            ctz: 1,
            tipoCodAut: 'E', // CAE
            codAut: Number.parseInt(invoice.cae),
        };

        // Agregar datos del receptor si tiene documento
        if (invoice.receiverDocumentNumber && invoice.receiverDocumentType !== 99) {
            qrData.tipoDocRec = invoice.receiverDocumentType;
            qrData.nroDocRec = Number.parseInt(invoice.receiverDocumentNumber);
        }

        // Convertir a JSON y luego a Base64
        const jsonString = JSON.stringify(qrData);
        const base64Data = Buffer.from(jsonString).toString('base64');

        return `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`;
    }

    /**
     * Genera la imagen QR en Base64 para incrustar en el PDF
     * @param invoice - Factura con CAE autorizado
     * @returns Data URL de la imagen QR (base64)
     */
    async generateQrImage(invoice: Invoice): Promise<string> {
        const qrUrl = this.generateQrData(invoice);

        // Generar imagen QR en formato Data URL
        const qrImageDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'M',
        });

        return qrImageDataUrl;
    }

    /**
     * Genera la imagen QR como Buffer PNG
     * @param invoice - Factura con CAE autorizado
     * @returns Buffer con la imagen PNG
     */
    async generateQrBuffer(invoice: Invoice): Promise<Buffer> {
        const qrUrl = this.generateQrData(invoice);

        return QRCode.toBuffer(qrUrl, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'M',
        });
    }

    /**
     * Formatea una fecha a YYYY-MM-DD
     */
    private formatDate(date: Date): string {
        return date.toISOString().slice(0, 10);
    }
}
