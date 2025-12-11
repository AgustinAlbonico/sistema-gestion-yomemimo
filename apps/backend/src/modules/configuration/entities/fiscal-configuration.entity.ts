/**
 * Configuración fiscal del sistema (AFIP)
 * Almacena datos del emisor, certificados y configuración de facturación
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { IvaCondition } from '../../../common/enums/iva-condition.enum';


/**
 * Entornos de AFIP
 */
export enum AfipEnvironment {
    HOMOLOGACION = 'homologacion',
    PRODUCCION = 'produccion',
}

@Entity('fiscal_configuration')
export class FiscalConfiguration {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // === DATOS DEL EMISOR ===
    @Column({ type: 'varchar', length: 200, nullable: true })
    businessName!: string | null; // Razón social

    @Column({ type: 'varchar', length: 11, nullable: true })
    cuit!: string | null; // CUIT del emisor (11 dígitos)

    @Column({ type: 'varchar', length: 50, nullable: true })
    grossIncome!: string | null; // Número de Ingresos Brutos

    @Column({ type: 'date', nullable: true })
    activityStartDate!: Date | null; // Fecha de inicio de actividades

    @Column({ type: 'varchar', length: 300, nullable: true })
    businessAddress!: string | null; // Domicilio comercial

    @Column({
        type: 'enum',
        enum: IvaCondition,
        default: IvaCondition.RESPONSABLE_MONOTRIBUTO,
    })
    ivaCondition!: IvaCondition;

    @Column({ type: 'int', default: 1 })
    pointOfSale!: number; // Punto de venta AFIP (1-5 dígitos)

    // === CONFIGURACIÓN DE ENTORNO ===
    @Column({
        type: 'enum',
        enum: AfipEnvironment,
        default: AfipEnvironment.HOMOLOGACION,
    })
    afipEnvironment!: AfipEnvironment;

    // === CERTIFICADOS HOMOLOGACIÓN (cifrados) ===
    @Column({ type: 'text', nullable: true })
    homologacionCertificate!: string | null; // .crt cifrado

    @Column({ type: 'text', nullable: true })
    homologacionPrivateKey!: string | null; // .key cifrado

    @Column({ type: 'timestamp', nullable: true })
    homologacionUploadedAt!: Date | null;

    @Column({ type: 'date', nullable: true })
    homologacionExpiresAt!: Date | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    homologacionFingerprint!: string | null; // SHA-256 del certificado

    // === CERTIFICADOS PRODUCCIÓN (cifrados) ===
    @Column({ type: 'text', nullable: true })
    produccionCertificate!: string | null; // .crt cifrado

    @Column({ type: 'text', nullable: true })
    produccionPrivateKey!: string | null; // .key cifrado

    @Column({ type: 'timestamp', nullable: true })
    produccionUploadedAt!: Date | null;

    @Column({ type: 'date', nullable: true })
    produccionExpiresAt!: Date | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    produccionFingerprint!: string | null; // SHA-256 del certificado

    // === ESTADO DE CONFIGURACIÓN ===
    @Column({ type: 'boolean', default: false })
    isConfigured!: boolean; // Si los datos básicos están completos

    @Column({ type: 'boolean', default: false })
    homologacionReady!: boolean; // Si los certificados de homologación están listos

    @Column({ type: 'boolean', default: false })
    produccionReady!: boolean; // Si los certificados de producción están listos

    // === TOKEN DE AUTENTICACIÓN AFIP (WSAA) - HOMOLOGACIÓN ===
    // Se persiste para no perderlo si se reinicia el servidor
    @Column({ type: 'text', nullable: true })
    wsaaTokenHomologacion!: string | null; // Token de autenticación homologación

    @Column({ type: 'text', nullable: true })
    wsaaSignHomologacion!: string | null; // Firma del token homologación

    @Column({ type: 'timestamp', nullable: true })
    wsaaTokenExpirationHomologacion!: Date | null; // Fecha de expiración del token homologación

    // === TOKEN DE AUTENTICACIÓN AFIP (WSAA) - PRODUCCIÓN ===
    @Column({ type: 'text', nullable: true })
    wsaaTokenProduccion!: string | null; // Token de autenticación producción

    @Column({ type: 'text', nullable: true })
    wsaaSignProduccion!: string | null; // Firma del token producción

    @Column({ type: 'timestamp', nullable: true })
    wsaaTokenExpirationProduccion!: Date | null; // Fecha de expiración del token producción

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

