/**
 * Servicio de gestión de facturas fiscales
 * Coordina la generación de facturas, comunicación con AFIP, QR y PDF
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Invoice, InvoiceType, InvoiceStatus, DocumentType } from '../entities/invoice.entity';
import { IvaCondition } from '../../../common/enums/iva-condition.enum';
import { AfipService, InvoiceRequest } from './afip.service';
import { QrGeneratorService } from './qr-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);

    constructor(
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>,
        @InjectRepository(Sale)
        private saleRepo: Repository<Sale>,
        @InjectRepository(SaleItem)
        private saleItemRepo: Repository<SaleItem>,
        private dataSource: DataSource,
        private afipService: AfipService,
        private qrGeneratorService: QrGeneratorService,
        private pdfGeneratorService: PdfGeneratorService,
        private configService: ConfigService,
    ) { }

    /**
     * Genera una factura fiscal para una venta
     * @param saleId - ID de la venta
     * @param manager - Transaction manager opcional (para usar dentro de transacciones)
     * @returns Factura generada (puede estar autorizada o pendiente)
     */
    async generateInvoice(saleId: string, manager?: any): Promise<Invoice> {
        // Usar manager si se proporciona, sino usar repos normales
        const saleRepo = manager ? manager.getRepository(Sale) : this.saleRepo;
        const invoiceRepo = manager ? manager.getRepository(Invoice) : this.invoiceRepo;

        // Obtener la venta con sus items y cliente
        const sale = await saleRepo.findOne({
            where: { id: saleId },
            relations: ['customer', 'items', 'items.product'],
        });

        if (!sale) {
            throw new NotFoundException('Venta no encontrada');
        }

        // Verificar que la venta no tenga factura
        const existingInvoice = await invoiceRepo.findOne({
            where: { saleId },
        });

        if (existingInvoice) {
            throw new BadRequestException('La venta ya tiene una factura asociada');
        }

        // Verificar estado de la venta
        if (sale.status === SaleStatus.CANCELLED) {
            throw new BadRequestException('No se puede facturar una venta cancelada');
        }

        // Obtener configuración AFIP
        const afipConfig = await this.afipService.getConfiguration();
        if (!afipConfig) {
            throw new BadRequestException('AFIP no está configurado');
        }

        // Determinar tipo de factura
        // Nota: Si el cliente no tiene condición IVA definida, asumimos Consumidor Final
        const receiverIvaCondition = IvaCondition.CONSUMIDOR_FINAL;
        const invoiceType = this.afipService.determineInvoiceType(
            afipConfig.ivaCondition,
            receiverIvaCondition
        );

        // Crear factura en estado pendiente
        const invoice = this.invoiceRepo.create({
            saleId,
            invoiceType,
            pointOfSale: afipConfig.pointOfSale,
            issueDate: new Date(),

            // Datos del emisor
            emitterCuit: afipConfig.cuit,
            emitterBusinessName: afipConfig.businessName,
            emitterAddress: afipConfig.businessAddress,
            emitterIvaCondition: afipConfig.ivaCondition,
            emitterGrossIncome: afipConfig.grossIncome,
            emitterActivityStartDate: afipConfig.activityStartDate,

            // Datos del receptor
            receiverDocumentType: this.getDocumentType(sale.customer),
            receiverDocumentNumber: sale.customer?.documentNumber || null,
            receiverName: sale.customerName || (sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : null),
            receiverAddress: sale.customer?.address || null,
            receiverIvaCondition: receiverIvaCondition,

            // Importes
            subtotal: sale.subtotal,
            discount: sale.discount,
            otherTaxes: sale.tax,
            total: sale.total,

            // IVA (calculado si es RI)
            netAmount: this.calculateNetAmount(sale, invoiceType),
            iva21: this.calculateIva21(sale, invoiceType),
            iva105: 0,
            iva27: 0,
            netAmountExempt: 0,

            // Condición de venta
            saleCondition: sale.isOnAccount ? 'Cuenta Corriente' : 'Contado',

            status: InvoiceStatus.PENDING,
        });

        const saveRepo = manager ? manager.getRepository(Invoice) : this.invoiceRepo;
        const savedInvoice = await saveRepo.save(invoice);

        // Intentar autorizar con AFIP
        try {
            const afipResponse = await this.authorizeWithAfip(savedInvoice, sale);

            if (afipResponse.success) {
                savedInvoice.status = InvoiceStatus.AUTHORIZED;
                savedInvoice.cae = afipResponse.cae || null;
                savedInvoice.caeExpirationDate = afipResponse.caeExpirationDate
                    ? this.afipService.parseAfipDate(afipResponse.caeExpirationDate)
                    : null;
                savedInvoice.invoiceNumber = afipResponse.invoiceNumber || null;

                // Generar QR
                savedInvoice.qrData = this.qrGeneratorService.generateQrData(savedInvoice);

                // Actualizar venta como fiscal y limpiar estado de factura pendiente (usar manager si está disponible)
                if (manager) {
                    await manager.getRepository(Sale).update(saleId, {
                        isFiscal: true,
                        fiscalPending: false,
                        fiscalError: null
                    });
                } else {
                    await this.saleRepo.update(saleId, {
                        isFiscal: true,
                        fiscalPending: false,
                        fiscalError: null
                    });
                }

                this.logger.log(`Factura autorizada: ${savedInvoice.invoiceNumber}, CAE: ${savedInvoice.cae}`);
            } else {
                savedInvoice.status = InvoiceStatus.REJECTED;
                savedInvoice.afipErrorMessage = afipResponse.errors?.join(', ') || 'Error desconocido';
                this.logger.warn(`Factura rechazada: ${savedInvoice.afipErrorMessage}`);
            }

            savedInvoice.afipResponse = JSON.stringify(afipResponse);
        } catch (error) {
            savedInvoice.status = InvoiceStatus.ERROR;
            savedInvoice.afipErrorMessage = (error as Error).message;
            this.logger.error('Error al autorizar factura:', error);
        }

        return saveRepo.save(savedInvoice);
    }

    /**
     * Obtiene una factura por ID
     */
    async findOne(id: string): Promise<Invoice> {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: ['sale'],
        });

        if (!invoice) {
            throw new NotFoundException('Factura no encontrada');
        }

        return invoice;
    }

    /**
     * Obtiene la factura de una venta
     */
    async findBySaleId(saleId: string): Promise<Invoice | null> {
        return this.invoiceRepo.findOne({
            where: { saleId },
        });
    }

    /**
     * Genera el PDF de una factura
     */
    async generatePdf(invoiceId: string): Promise<Buffer> {
        const invoice = await this.findOne(invoiceId);

        if (invoice.status !== InvoiceStatus.AUTHORIZED) {
            throw new BadRequestException('Solo se puede generar PDF de facturas autorizadas');
        }

        // Obtener items de la venta
        const items = await this.saleItemRepo.find({
            where: { sale: { id: invoice.saleId } },
            relations: ['product'],
        });

        return this.pdfGeneratorService.generateInvoicePdf(invoice, items);
    }

    /**
     * Reintenta autorizar una factura que falló
     */
    async retryAuthorization(invoiceId: string): Promise<Invoice> {
        const invoice = await this.findOne(invoiceId);

        if (invoice.status === InvoiceStatus.AUTHORIZED) {
            throw new BadRequestException('La factura ya está autorizada');
        }

        const sale = await this.saleRepo.findOne({
            where: { id: invoice.saleId },
            relations: ['customer', 'items', 'items.product'],
        });

        if (!sale) {
            throw new NotFoundException('Venta no encontrada');
        }

        // Recalcular netAmount antes de reintentar (por si había un valor incorrecto guardado)
        invoice.netAmount = this.calculateNetAmount(sale, invoice.invoiceType);
        invoice.iva21 = this.calculateIva21(sale, invoice.invoiceType);

        // Reintentar autorización
        try {
            const afipResponse = await this.authorizeWithAfip(invoice, sale);

            if (afipResponse.success) {
                invoice.status = InvoiceStatus.AUTHORIZED;
                invoice.cae = afipResponse.cae || null;
                invoice.caeExpirationDate = afipResponse.caeExpirationDate
                    ? this.afipService.parseAfipDate(afipResponse.caeExpirationDate)
                    : null;
                invoice.invoiceNumber = afipResponse.invoiceNumber || null;
                invoice.qrData = this.qrGeneratorService.generateQrData(invoice);
                invoice.afipErrorMessage = null;

                // Actualizar venta como fiscal y limpiar estado de factura pendiente
                await this.saleRepo.update(invoice.saleId, {
                    isFiscal: true,
                    fiscalPending: false,
                    fiscalError: null
                });
            } else {
                invoice.status = InvoiceStatus.REJECTED;
                invoice.afipErrorMessage = afipResponse.errors?.join(', ') || 'Error desconocido';
            }

            invoice.afipResponse = JSON.stringify(afipResponse);
        } catch (error) {
            invoice.status = InvoiceStatus.ERROR;
            invoice.afipErrorMessage = (error as Error).message;
        }

        return this.invoiceRepo.save(invoice);
    }

    /**
     * Lista facturas con filtros
     */
    async findAll(filters: {
        status?: InvoiceStatus;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }) {
        const { status, from, to, page = 1, limit = 20 } = filters;

        const qb = this.invoiceRepo.createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.sale', 'sale');

        if (status) {
            qb.andWhere('invoice.status = :status', { status });
        }

        if (from) {
            qb.andWhere('invoice.issueDate >= :from', { from });
        }

        if (to) {
            qb.andWhere('invoice.issueDate <= :to', { to });
        }

        qb.orderBy('invoice.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Autoriza una factura con AFIP
     */
    private async authorizeWithAfip(invoice: Invoice, sale: Sale) {
        const request: InvoiceRequest = {
            invoiceType: invoice.invoiceType,
            pointOfSale: invoice.pointOfSale,
            concept: 1, // Productos
            docType: invoice.receiverDocumentType,
            docNumber: invoice.receiverDocumentNumber || '0',
            receiverIvaCondition: this.getIvaConditionCode(sale.customer?.ivaCondition),
            issueDate: this.afipService.formatDateForAfip(invoice.issueDate),
            total: Number(invoice.total),
            netAmount: Number(invoice.netAmount),
            netAmountExempt: Number(invoice.netAmountExempt),
            iva: this.buildIvaArray(invoice),
            otherTaxes: Number(invoice.otherTaxes),
        };

        return this.afipService.authorizeInvoice(request);
    }

    /**
     * Mapea la condición de IVA del cliente al código de AFIP
     * Códigos de AFIP según Resolución General 5616:
     * 1 = IVA Responsable Inscripto
     * 2 = IVA Responsable no Inscripto
     * 3 = IVA no Responsable
     * 4 = IVA Sujeto Exento
     * 5 = Consumidor Final
     * 6 = Responsable Monotributo
     */
    private getIvaConditionCode(ivaCondition?: string | null): number {
        if (!ivaCondition) {
            return 5; // Consumidor Final por defecto
        }

        const condition = ivaCondition.toUpperCase();

        switch (condition) {
            case 'RESPONSABLE_INSCRIPTO':
            case 'RESPONSABLE INSCRIPTO':
                return 1;
            case 'RESPONSABLE_MONOTRIBUTO':
            case 'MONOTRIBUTISTA':
            case 'MONOTRIBUTO':
                return 6;
            case 'EXENTO':
                return 4;
            case 'CONSUMIDOR_FINAL':
            case 'CONSUMIDOR FINAL':
            default:
                return 5; // Consumidor Final
        }
    }

    /**
     * Construye el array de IVA para AFIP
     */
    private buildIvaArray(invoice: Invoice): { id: number; baseAmount: number; amount: number }[] {
        const iva: { id: number; baseAmount: number; amount: number }[] = [];

        // Para Factura C (monotributo) no se discrimina IVA
        if (invoice.invoiceType === InvoiceType.FACTURA_C) {
            return iva;
        }

        if (invoice.iva21 > 0) {
            iva.push({
                id: 5, // 21%
                baseAmount: invoice.netAmount * 0.21,
                amount: Number(invoice.iva21),
            });
        }

        if (invoice.iva105 > 0) {
            iva.push({
                id: 4, // 10.5%
                baseAmount: invoice.netAmount * 0.105,
                amount: Number(invoice.iva105),
            });
        }

        if (invoice.iva27 > 0) {
            iva.push({
                id: 6, // 27%
                baseAmount: invoice.netAmount * 0.27,
                amount: Number(invoice.iva27),
            });
        }

        return iva;
    }

    /**
     * Obtiene el tipo de documento del cliente
     */
    private getDocumentType(customer: Sale['customer']): number {
        if (!customer) {
            return DocumentType.SIN_IDENTIFICAR;
        }

        // Mapear según el tipo de documento del cliente
        const docType = customer.documentType?.toUpperCase();
        switch (docType) {
            case 'CUIT': return DocumentType.CUIT;
            case 'CUIL': return DocumentType.CUIL;
            case 'DNI': return DocumentType.DNI;
            default: return DocumentType.SIN_IDENTIFICAR;
        }
    }

    /**
     * Calcula el importe neto gravado
     * Para Factura C (monotributo): el total va como neto (no se discrimina IVA)
     * Para Factura A/B (RI): se calcula el neto sin IVA
     */
    private calculateNetAmount(sale: Sale, invoiceType: InvoiceType): number {
        if (invoiceType === InvoiceType.FACTURA_C) {
            // Monotributo: todo el importe va como neto (no hay IVA)
            return Number(sale.total);
        }
        // Para RI: total / 1.21 (asumiendo 21% IVA)
        return Number((sale.total / 1.21).toFixed(2));
    }

    /**
     * Calcula el IVA 21% (para RI)
     */
    private calculateIva21(sale: Sale, invoiceType: InvoiceType): number {
        if (invoiceType === InvoiceType.FACTURA_C) {
            return 0;
        }
        const netAmount = sale.total / 1.21;
        return Number((netAmount * 0.21).toFixed(2));
    }

    /**
     * Genera el HTML del comprobante/recibo de una venta (no fiscal)
     */
    async generateReceiptHtml(saleId: string): Promise<string> {
        // Obtener la venta con todas sus relaciones
        const sale = await this.saleRepo.findOne({
            where: { id: saleId },
            relations: ['customer', 'items', 'items.product', 'payments'],
        });

        if (!sale) {
            throw new NotFoundException('Venta no encontrada');
        }

        // Formatear fecha
        const formattedDate = sale.saleDate.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        // Generar HTML del comprobante
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprobante de Venta - ${sale.saleNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            background: #f5f5f5;
        }
        .receipt {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 5px;
        }
        .header .subtitle {
            color: #666;
            font-size: 14px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
        }
        .info-row strong {
            color: #333;
        }
        .info-row span {
            color: #666;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        table th {
            background: #f8f8f8;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            color: #333;
            border-bottom: 2px solid #ddd;
        }
        table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            color: #666;
        }
        table tr:last-child td {
            border-bottom: none;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-top: 30px;
            border-top: 2px solid #333;
            padding-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
        }
        .total-row.final {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #333;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .receipt {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h1>COMPROBANTE DE VENTA</h1>
            <p class="subtitle">Este no es un comprobante fiscal válido</p>
        </div>

        <div class="section">
            <div class="info-row">
                <strong>Número de Comprobante:</strong>
                <span>${sale.saleNumber}</span>
            </div>
            <div class="info-row">
                <strong>Fecha:</strong>
                <span>${formattedDate}</span>
            </div>
            ${sale.customer ? `
            <div class="info-row">
                <strong>Cliente:</strong>
                <span>${sale.customer.firstName} ${sale.customer.lastName}</span>
            </div>
            ${sale.customer.documentNumber ? `
            <div class="info-row">
                <strong>${sale.customer.documentType}:</strong>
                <span>${sale.customer.documentNumber}</span>
            </div>
            ` : ''}
            ` : `
            <div class="info-row">
                <strong>Cliente:</strong>
                <span>Consumidor Final</span>
            </div>
            `}
        </div>

        <div class="section">
            <h2 class="section-title">Productos</h2>
            <table>
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th class="text-right">Cantidad</th>
                        <th class="text-right">Precio Unit.</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(item => `
                    <tr>
                        <td>${item.productDescription}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">$${Number(item.unitPrice).toFixed(2)}</td>
                        <td class="text-right">$${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>$${Number(sale.subtotal).toFixed(2)}</span>
            </div>
            ${sale.discount > 0 ? `
            <div class="total-row">
                <span>Descuento:</span>
                <span>- $${Number(sale.discount).toFixed(2)}</span>
            </div>
            ` : ''}
            ${sale.tax > 0 ? `
            <div class="total-row">
                <span>Impuestos/Recargos:</span>
                <span>$${Number(sale.tax).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
                <span>TOTAL:</span>
                <span>$${Number(sale.total).toFixed(2)}</span>
            </div>
        </div>

        ${sale.payments && sale.payments.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Forma de Pago</h2>
            <table>
                <thead>
                    <tr>
                        <th>Método</th>
                        <th class="text-right">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.payments.map(payment => `
                    <tr>
                        <td>${payment.paymentMethod?.name || 'Desconocido'}</td>
                        <td class="text-right">$${Number(payment.amount).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            <p>Gracias por su compra</p>
            <p>Este comprobante no tiene validez fiscal</p>
        </div>
    </div>

    <script>
        // Auto-imprimir al cargar (opcional)
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>
        `;

        return html.trim();
    }

    /**
     * Obtiene la etiqueta legible de un método de pago
     */
    private getPaymentMethodLabel(method: string): string {
        const labels: Record<string, string> = {
            'CASH': 'Efectivo',
            'DEBIT_CARD': 'Tarjeta de Débito',
            'CREDIT_CARD': 'Tarjeta de Crédito',
            'TRANSFER': 'Transferencia',
            'QR': 'Código QR',
            'CHECK': 'Cheque',
            'OTHER': 'Otro',
        };
        return labels[method] || method;
    }

    /**
     * Genera el PDF de una nota de venta (no fiscal)
     * @param saleId - ID de la venta
     * @returns Buffer del PDF generado
     */
    async generateSaleNotePdf(saleId: string): Promise<Buffer> {
        // Obtener la venta con todas sus relaciones
        const sale = await this.saleRepo.findOne({
            where: { id: saleId },
            relations: ['customer', 'items', 'items.product', 'payments'],
        });

        if (!sale) {
            throw new NotFoundException('Venta no encontrada');
        }

        // Obtener configuración fiscal (para datos del emisor)
        const fiscalConfig = await this.afipService.getConfiguration();

        // Generar PDF
        return this.pdfGeneratorService.generateSaleNotePdf(sale, fiscalConfig);
    }
}
