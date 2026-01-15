/**
 * Entidad Invoice - Representa una factura fiscal (AFIP)
 * Almacena los datos del comprobante autorizado por AFIP
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Sale } from './sale.entity';

/**
 * Tipos de comprobante según AFIP
 */
export enum InvoiceType {
    FACTURA_A = 1,
    FACTURA_B = 6,
    FACTURA_C = 11,
}

/**
 * Estados de la factura
 */
export enum InvoiceStatus {
    PENDING = 'pending',           // Pendiente de autorización AFIP
    AUTHORIZED = 'authorized',     // Autorizada con CAE
    REJECTED = 'rejected',         // Rechazada por AFIP
    ERROR = 'error',               // Error de comunicación
}

// Re-exportar IvaCondition desde common enum
export { IvaCondition } from '../../../common/enums/iva-condition.enum';

/**
 * Tipos de documento del receptor
 */
export enum DocumentType {
    DNI = 96,
    CUIT = 80,
    CUIL = 86,
    CDI = 87,
    LE = 89,
    LC = 90,
    CI_EXTRANJERA = 91,
    PASAPORTE = 94,
    SIN_IDENTIFICAR = 99,
}

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'sale_id', unique: true })
    saleId!: string;

    @OneToOne(() => Sale)
    @JoinColumn({ name: 'sale_id' })
    sale!: Sale;

    // === DATOS DEL COMPROBANTE ===
    @Column({ type: 'int' })
    invoiceType!: InvoiceType;

    @Column({ type: 'int' })
    pointOfSale!: number;

    @Column({ type: 'bigint', nullable: true })
    invoiceNumber!: number | null;

    @Column({ type: 'timestamp' })
    issueDate!: Date;

    // === DATOS DEL EMISOR (snapshot al momento de emisión) ===
    @Column({ type: 'varchar', length: 11 })
    emitterCuit!: string;

    @Column({ type: 'varchar', length: 200 })
    emitterBusinessName!: string;

    @Column({ type: 'varchar', length: 300 })
    emitterAddress!: string;

    @Column({ type: 'varchar', length: 50 })
    emitterIvaCondition!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    emitterGrossIncome!: string | null;

    @Column({ type: 'date', nullable: true })
    emitterActivityStartDate!: Date | null;

    // === DATOS DEL RECEPTOR ===
    @Column({ type: 'int' })
    receiverDocumentType!: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    receiverDocumentNumber!: string | null;

    @Column({ type: 'varchar', length: 200, nullable: true })
    receiverName!: string | null;

    @Column({ type: 'varchar', length: 300, nullable: true })
    receiverAddress!: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    receiverIvaCondition!: string | null;

    // === IMPORTES ===
    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    subtotal!: number;

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    discount!: number;

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    otherTaxes!: number;

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    total!: number;

    // === IVA (solo para Responsable Inscripto) ===
    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    netAmount!: number; // Importe neto gravado

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    iva21!: number;

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    iva105!: number;

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    iva27!: number;

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    netAmountExempt!: number; // Importe no gravado

    // === CONDICIÓN DE VENTA ===
    @Column({ type: 'varchar', length: 100 })
    saleCondition!: string;

    // === AUTORIZACIÓN AFIP ===
    @Column({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.PENDING,
    })
    status!: InvoiceStatus;

    @Column({ type: 'varchar', length: 14, nullable: true })
    cae!: string | null; // Código de Autorización Electrónico (14 dígitos)

    @Column({ type: 'date', nullable: true })
    caeExpirationDate!: Date | null;

    // === QR y PDF ===
    @Column({ type: 'text', nullable: true })
    qrData!: string | null; // URL del QR con datos en Base64

    @Column({ type: 'varchar', length: 500, nullable: true })
    pdfPath!: string | null;

    // === RESPUESTA AFIP (para debug/auditoría) ===
    @Column({ type: 'text', nullable: true })
    afipResponse!: string | null;

    @Column({ type: 'text', nullable: true })
    afipErrorMessage!: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
