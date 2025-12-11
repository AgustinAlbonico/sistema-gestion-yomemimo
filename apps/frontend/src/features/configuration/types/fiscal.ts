/**
 * Tipos para configuración fiscal AFIP
 */

export enum IvaCondition {
    CONSUMIDOR_FINAL = 'CONSUMIDOR_FINAL',
    RESPONSABLE_MONOTRIBUTO = 'RESPONSABLE_MONOTRIBUTO',
    RESPONSABLE_INSCRIPTO = 'RESPONSABLE_INSCRIPTO',
    EXENTO = 'EXENTO',
}

export const IvaConditionLabels: Record<IvaCondition, string> = {
    [IvaCondition.CONSUMIDOR_FINAL]: 'Consumidor Final',
    [IvaCondition.RESPONSABLE_MONOTRIBUTO]: 'Responsable Monotributo',
    [IvaCondition.RESPONSABLE_INSCRIPTO]: 'Responsable Inscripto',
    [IvaCondition.EXENTO]: 'Exento',
};

export enum AfipEnvironment {
    HOMOLOGACION = 'homologacion',
    PRODUCCION = 'produccion',
}

export const AfipEnvironmentLabels: Record<AfipEnvironment, string> = {
    [AfipEnvironment.HOMOLOGACION]: 'Homologación (Testing)',
    [AfipEnvironment.PRODUCCION]: 'Producción',
};

/**
 * Configuración fiscal (respuesta del backend)
 */
export interface FiscalConfiguration {
    id: string;
    businessName?: string | null;
    cuit?: string | null;
    grossIncome?: string | null;
    activityStartDate?: string | null;
    businessAddress?: string | null;
    ivaCondition: IvaCondition;
    pointOfSale: number;
    afipEnvironment: AfipEnvironment;
    isConfigured: boolean;

    // Certificados homologación
    homologacionReady: boolean;
    homologacionUploadedAt?: string | null;
    homologacionExpiresAt?: string | null;
    homologacionFingerprint?: string | null;

    // Certificados producción
    produccionReady: boolean;
    produccionUploadedAt?: string | null;
    produccionExpiresAt?: string | null;
    produccionFingerprint?: string | null;

    createdAt: string;
    updatedAt: string;
}

/**
 * DTO para actualizar datos del emisor
 */
export interface UpdateEmitterDataDTO {
    businessName?: string;
    cuit?: string;
    grossIncome?: string;
    activityStartDate?: string;
    businessAddress?: string;
    ivaCondition?: IvaCondition;
    pointOfSale?: number;
}

/**
 * DTO para subir certificados
 */
export interface UploadCertificatesDTO {
    environment: AfipEnvironment;
    certificate: string; // Base64
    privateKey: string;  // Base64
    expiresAt?: string;
}

/**
 * Estado de conexión AFIP
 */
export interface AfipConnectionStatus {
    configured: boolean;
    environment: AfipEnvironment;
    certificatesReady: boolean;
    connection: {
        success: boolean;
        message: string;
        testedAt: string;
    };
}

/**
 * Estado de preparación para facturar
 */
export interface InvoicingReadyStatus {
    ready: boolean;
    missingFields: string[];
}

/**
 * Respuesta de generación de certificados
 */
export interface GenerateCertificateResponse {
    csr: string; // Base64
    privateKey: string; // Base64
    fingerprint: string;
    generatedAt: string;
    environment: AfipEnvironment;
    instructions: string;
}

