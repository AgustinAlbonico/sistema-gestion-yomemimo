/**
 * Factory para crear facturas de prueba
 * Soporta todos los campos de la entidad Invoice
 */

import { InvoiceType, InvoiceStatus, DocumentType, IvaCondition } from '../../src/modules/sales/entities/invoice.entity';

let invoiceCounter = 0;

/**
 * Crea una factura autorizada (con CAE)
 */
export const createAuthorizedInvoice = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    invoiceCounter += 1;
    const now = new Date();
    const caeExpiration = new Date(now);
    caeExpiration.setDate(caeExpiration.getDate() + 10);

    return {
        id: `invoice-${invoiceCounter}`,
        saleId,
        invoiceType: InvoiceType.FACTURA_C,
        pointOfSale: 1,
        invoiceNumber: 1000 + invoiceCounter,
        issueDate: now,

        // Datos del emisor
        emitterCuit: '20123456789',
        emitterBusinessName: 'Mi Negocio',
        emitterAddress: 'Av. Corrientes 1234, CABA',
        emitterIvaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
        emitterGrossIncome: '901-123456-1',
        emitterActivityStartDate: new Date('2020-01-01'),

        // Datos del receptor
        receiverDocumentType: DocumentType.SIN_IDENTIFICAR,
        receiverDocumentNumber: null,
        receiverName: 'Consumidor Final',
        receiverAddress: null,
        receiverIvaCondition: IvaCondition.CONSUMIDOR_FINAL,

        // Importes
        subtotal: 100,
        discount: 0,
        otherTaxes: 0,
        total: 100,

        // IVA
        netAmount: 100,
        iva21: 0,
        iva105: 0,
        iva27: 0,
        netAmountExempt: 0,

        // Condición de venta
        saleCondition: 'Contado',

        // Autorización AFIP
        status: InvoiceStatus.AUTHORIZED,
        cae: generateCae(invoiceCounter),
        caeExpirationDate: caeExpiration,

        // QR y PDF
        qrData: generateQrData(invoiceCounter),
        pdfPath: null,

        // Respuesta AFIP
        afipResponse: JSON.stringify({ success: true, cae: generateCae(invoiceCounter) }),
        afipErrorMessage: null,

        createdAt: now,
        updatedAt: now,

        ...overrides,
    };
};

/**
 * Crea una Factura A (Responsable Inscripto)
 */
export const createFacturaA = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    const subtotal = 100;
    const iva21 = 21;
    const total = subtotal + iva21;

    return createAuthorizedInvoice(saleId, {
        invoiceType: InvoiceType.FACTURA_A,
        emitterIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        receiverDocumentType: DocumentType.CUIT,
        receiverDocumentNumber: '20123456789',
        receiverName: 'Empresa Cliente S.A.',
        receiverIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        subtotal,
        netAmount: subtotal,
        iva21,
        total,
        saleCondition: 'Cuenta Corriente',
        ...overrides,
    });
};

/**
 * Crea una Factura B (Consumidor Final con IVA discriminado)
 */
export const createFacturaB = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    const subtotal = 100;
    const iva21 = 21;
    const total = subtotal + iva21;

    return createAuthorizedInvoice(saleId, {
        invoiceType: InvoiceType.FACTURA_B,
        emitterIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        receiverDocumentType: DocumentType.DNI,
        receiverDocumentNumber: '12345678',
        receiverName: 'Juan Pérez',
        receiverIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
        subtotal,
        netAmount: subtotal,
        iva21,
        total,
        ...overrides,
    });
};

/**
 * Crea una Factura C (Monotributo)
 */
export const createFacturaC = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    return createAuthorizedInvoice(saleId, {
        invoiceType: InvoiceType.FACTURA_C,
        emitterIvaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
        receiverDocumentType: DocumentType.SIN_IDENTIFICAR,
        receiverDocumentNumber: null,
        receiverName: 'Consumidor Final',
        receiverIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
        netAmount: 100, // Para Factura C, el total va como neto
        ...overrides,
    });
};

/**
 * Crea una factura pendiente (sin CAE aún)
 */
export const createPendingInvoice = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    return {
        ...createFacturaC(saleId),
        status: InvoiceStatus.PENDING,
        cae: null,
        caeExpirationDate: null,
        qrData: null,
        afipResponse: null,
        ...overrides,
    };
};

/**
 * Crea una factura rechazada por AFIP
 */
export const createRejectedInvoice = (saleId: string, errorMessage: string) => {
    return {
        ...createFacturaC(saleId),
        status: InvoiceStatus.REJECTED,
        cae: null,
        caeExpirationDate: null,
        qrData: null,
        afipErrorMessage: errorMessage,
        afipResponse: JSON.stringify({ success: false, errors: [errorMessage] }),
    };
};

/**
 * Crea una factura con error de comunicación
 */
export const createErrorInvoice = (saleId: string, errorMessage: string) => {
    return {
        ...createFacturaC(saleId),
        status: InvoiceStatus.ERROR,
        cae: null,
        caeExpirationDate: null,
        qrData: null,
        afipErrorMessage: errorMessage,
        afipResponse: null,
    };
};

/**
 * Crea una factura con IVA 10.5%
 */
export const createFacturaWithIva105 = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    const subtotal = 100;
    const ivaAmount = 10.5;
    const total = subtotal + ivaAmount;

    return createAuthorizedInvoice(saleId, {
        invoiceType: InvoiceType.FACTURA_A,
        emitterIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        receiverDocumentType: DocumentType.CUIT,
        receiverDocumentNumber: '20123456789',
        receiverName: 'Empresa Cliente S.A.',
        receiverIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        subtotal,
        netAmount: subtotal,
        iva21: 0,
        iva105: ivaAmount,
        total,
        ...overrides,
    });
};

/**
 * Crea una factura con múltiples alícuotas de IVA
 */
export const createFacturaWithMultipleIva = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    const iva21Base = 100;
    const iva105Base = 50;
    const iva21Amount = 21;
    const iva105Amount = 5.25;
    const subtotal = iva21Base + iva105Base;
    const total = subtotal + iva21Amount + iva105Amount;

    return createAuthorizedInvoice(saleId, {
        invoiceType: InvoiceType.FACTURA_A,
        emitterIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        receiverDocumentType: DocumentType.CUIT,
        receiverDocumentNumber: '20123456789',
        receiverName: 'Empresa Cliente S.A.',
        receiverIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        subtotal,
        netAmount: subtotal,
        iva21: iva21Amount,
        iva105: iva105Amount,
        total,
        ...overrides,
    });
};

/**
 * Crea una factura con descuento
 */
export const createFacturaWithDiscount = (saleId: string, discount: number, overrides: Partial<Record<string, unknown>> = {}) => {
    const subtotal = 100;
    const total = subtotal - discount;

    return createFacturaC(saleId, {
        subtotal,
        discount,
        total,
        netAmount: total,
        ...overrides,
    });
};

/**
 * Crea una factura a cuenta corriente
 */
export const createFacturaCuentaCorriente = (saleId: string, overrides: Partial<Record<string, unknown>> = {}) => {
    return createFacturaA(saleId, {
        saleCondition: 'Cuenta Corriente',
        ...overrides,
    });
};

/**
 * Genera un CAE de 14 dígitos
 */
function generateCae(counter: number): string {
    const base = String(Date.now() + counter);
    return base.padStart(14, '0').substring(0, 14);
}

/**
 * Genera datos QR de ejemplo
 */
function generateQrData(counter: number): string {
    return `${Date.now()}-${counter}`;
}

/**
 * Resetea el contador
 */
export const resetInvoiceCounter = () => {
    invoiceCounter = 0;
};

/**
 * Helpers para crear estados de factura específicos
 */
export const InvoiceFactoryHelpers = {
    /**
     * Crea una factura vencida (CAE expirado)
     */
    expired: (saleId: string): Record<string, unknown> => {
        const now = new Date();
        const expiration = new Date(now);
        expiration.setDate(expiration.getDate() - 15); // Hace 15 días

        return createFacturaC(saleId, {
            caeExpirationDate: expiration,
        });
    },

    /**
     * Crea una factura con recargos
     */
    withSurcharge: (saleId: string, surcharge: number): Record<string, unknown> => {
        const subtotal = 100;
        const total = subtotal + surcharge;

        return createFacturaC(saleId, {
            otherTaxes: surcharge,
            total,
            netAmount: total,
        });
    },

    /**
     * Crea una factura con importe exento
     */
    withExempt: (saleId: string, exemptAmount: number): Record<string, unknown> => {
        return createFacturaA(saleId, {
            netAmountExempt: exemptAmount,
        });
    },

    /**
     * Crea una factura con cliente específico
     */
    withCustomer: (
        saleId: string,
        docType: DocumentType,
        docNumber: string,
        name: string,
        ivaCondition: IvaCondition
    ): Record<string, unknown> => {
        return createFacturaC(saleId, {
            receiverDocumentType: docType,
            receiverDocumentNumber: docNumber,
            receiverName: name,
            receiverIvaCondition: ivaCondition,
        });
    },
};

/**
 * Exportar todos los helpers como valores individuales
 */
export const {
    expired,
    withSurcharge,
    withExempt,
    withCustomer,
} = InvoiceFactoryHelpers;
