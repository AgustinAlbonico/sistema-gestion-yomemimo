import { api } from '@/lib/axios';
import {
    FiscalConfiguration,
    UpdateEmitterDataDTO,
    UploadCertificatesDTO,
    AfipConnectionStatus,
    InvoicingReadyStatus,
    AfipEnvironment,
    GenerateCertificateResponse,
} from '../types/fiscal';

export const fiscalApi = {
    /**
     * Obtiene la configuración fiscal actual
     */
    getConfiguration: async (): Promise<FiscalConfiguration> => {
        const response = await api.get<FiscalConfiguration>('/api/configuration/fiscal');
        return response.data;
    },

    /**
     * Actualiza los datos del emisor
     */
    updateEmitterData: async (data: UpdateEmitterDataDTO): Promise<FiscalConfiguration> => {
        // Filtrar valores vacíos, null o undefined para campos opcionales
        const cleanedData = Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== '' && value !== null && value !== undefined)
        );
        const response = await api.patch<FiscalConfiguration>('/api/configuration/fiscal/emitter', cleanedData);
        return response.data;
    },

    /**
     * Cambia el entorno activo de AFIP
     */
    setEnvironment: async (environment: AfipEnvironment): Promise<FiscalConfiguration> => {
        const response = await api.patch<FiscalConfiguration>('/api/configuration/fiscal/environment', {
            environment,
        });
        return response.data;
    },

    /**
     * Genera un CSR y clave privada para certificados AFIP
     */
    generateCertificate: async (environment: AfipEnvironment): Promise<GenerateCertificateResponse> => {
        const response = await api.post<GenerateCertificateResponse>('/api/configuration/fiscal/certificates/generate', {
            environment,
        });
        return response.data;
    },

    /**
     * Sube certificados para un entorno
     */
    uploadCertificates: async (data: UploadCertificatesDTO): Promise<FiscalConfiguration> => {
        const response = await api.post<FiscalConfiguration>('/api/configuration/fiscal/certificates', data);
        return response.data;
    },

    /**
     * Elimina los certificados de un entorno
     */
    deleteCertificates: async (environment: AfipEnvironment): Promise<FiscalConfiguration> => {
        const response = await api.delete<FiscalConfiguration>(
            `/api/configuration/fiscal/certificates/${environment}`
        );
        return response.data;
    },

    /**
     * Verifica si está listo para facturar
     */
    getStatus: async (): Promise<InvoicingReadyStatus> => {
        const response = await api.get<InvoicingReadyStatus>('/api/configuration/fiscal/status');
        return response.data;
    },

    /**
     * Prueba la conexión con AFIP
     */
    testConnection: async (): Promise<AfipConnectionStatus> => {
        const response = await api.post<AfipConnectionStatus>('/api/invoices/afip/test-connection');
        return response.data;
    },
};


