/**
 * Controlador de facturas fiscales
 * Endpoints para generar, consultar y descargar facturas
 */
import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Res,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoiceService } from './services/invoice.service';
import { AfipService } from './services/afip.service';
import { InvoiceStatus } from './entities/invoice.entity';

@ApiTags('Facturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoiceController {
    constructor(
        private readonly invoiceService: InvoiceService,
        private readonly afipService: AfipService,
    ) { }

    /**
     * Genera una factura para una venta
     */
    @Post('generate/:saleId')
    @ApiOperation({ summary: 'Generar factura para una venta' })
    async generateInvoice(@Param('saleId', ParseUUIDPipe) saleId: string) {
        return this.invoiceService.generateInvoice(saleId);
    }

    /**
     * Lista facturas con filtros
     */
    @Get()
    @ApiOperation({ summary: 'Listar facturas' })
    @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAll(
        @Query('status') status?: InvoiceStatus,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.invoiceService.findAll({
            status,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    /**
     * Obtiene una factura por ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Obtener factura por ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.invoiceService.findOne(id);
    }

    /**
     * Obtiene la factura de una venta
     */
    @Get('sale/:saleId')
    @ApiOperation({ summary: 'Obtener factura de una venta' })
    async findBySaleId(@Param('saleId', ParseUUIDPipe) saleId: string) {
        return this.invoiceService.findBySaleId(saleId);
    }

    /**
     * Reintenta autorizar una factura
     */
    @Post(':id/retry')
    @ApiOperation({ summary: 'Reintentar autorización de factura' })
    async retryAuthorization(@Param('id', ParseUUIDPipe) id: string) {
        return this.invoiceService.retryAuthorization(id);
    }

    /**
     * Descarga el PDF de una factura
     */
    @Get(':id/pdf')
    @ApiOperation({ summary: 'Descargar PDF de factura' })
    async downloadPdf(
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.invoiceService.generatePdf(id);
        const invoice = await this.invoiceService.findOne(id);

        const filename = `factura-${invoice.pointOfSale?.toString().padStart(4, '0')}-${invoice.invoiceNumber?.toString().padStart(8, '0')}.pdf`;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    /**
     * Obtiene el HTML del comprobante/recibo de una venta
     * Este es un comprobante simple (no fiscal) que se puede imprimir
     */
    @Get('sale/:saleId/receipt')
    @ApiOperation({ summary: 'Obtener HTML del comprobante de venta (no fiscal)' })
    async getReceipt(
        @Param('saleId', ParseUUIDPipe) saleId: string,
        @Res() res: Response,
    ) {
        const html = await this.invoiceService.generateReceiptHtml(saleId);

        res.set({
            'Content-Type': 'text/html; charset=utf-8',
        });

        res.send(html);
    }

    /**
     * Descarga el PDF de la nota de venta (no fiscal)
     */
    @Get('sale/:saleId/note-pdf')
    @ApiOperation({ summary: 'Descargar PDF de nota de venta (no fiscal)' })
    async downloadSaleNotePdf(
        @Param('saleId', ParseUUIDPipe) saleId: string,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.invoiceService.generateSaleNotePdf(saleId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="nota-venta-${saleId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    /**
     * Prueba la conexión con AFIP
     */
    @Post('afip/test-connection')
    @ApiOperation({ summary: 'Probar conexión con AFIP' })
    @ApiResponse({
        status: 200,
        description: 'Resultado del test de conexión',
        schema: {
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
            },
        },
    })
    async testAfipConnection(): Promise<{ success: boolean; message: string }> {
        return this.afipService.testConnection();
    }

    /**
     * Limpia el token de autenticación AFIP
     * Útil cuando hay problemas de sincronización
     */
    @Post('afip/clear-token')
    @ApiOperation({ summary: 'Limpiar token de autenticación AFIP' })
    @ApiResponse({
        status: 200,
        description: 'Token limpiado exitosamente',
        schema: {
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
            },
        },
    })
    async clearAfipToken(): Promise<{ success: boolean; message: string }> {
        await this.afipService.invalidateAuthToken();
        return {
            success: true,
            message: 'Token de AFIP limpiado. El próximo intento de facturación solicitará un nuevo token.',
        };
    }
}
