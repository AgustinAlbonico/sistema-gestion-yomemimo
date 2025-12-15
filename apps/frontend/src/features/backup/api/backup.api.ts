/**
 * API client para el módulo de Backup
 */
import { api } from '@/lib/axios';
import { Backup, CreateBackupDto, DrivesResponse, BrowseResponse, BackupStatusResponse } from '../types';

export const backupApi = {
    /**
     * Obtener lista de backups
     */
    getAll: async (): Promise<Backup[]> => {
        const response = await api.get<Backup[]>('/api/backups');
        return response.data;
    },

    /**
     * Obtener un backup por ID
     */
    getById: async (id: string): Promise<Backup> => {
        const response = await api.get<Backup>(`/api/backups/${id}`);
        return response.data;
    },

    /**
     * Obtener unidades disponibles
     */
    getDrives: async (): Promise<DrivesResponse> => {
        const response = await api.get<DrivesResponse>('/api/backups/drives');
        return response.data;
    },

    /**
     * Explorar directorios
     */
    browseDirectory: async (path?: string): Promise<BrowseResponse> => {
        const params = path ? `?path=${encodeURIComponent(path)}` : '';
        const response = await api.get<BrowseResponse>(`/api/backups/browse${params}`);
        return response.data;
    },

    /**
     * Crear un nuevo backup
     */
    create: async (dto: CreateBackupDto): Promise<Backup> => {
        const response = await api.post<Backup>('/api/backups', dto);
        return response.data;
    },

    /**
     * Eliminar un backup
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/backups/${id}`);
    },

    /**
     * Obtener estado del backup (para alertas del dashboard)
     */
    getStatus: async (): Promise<BackupStatusResponse> => {
        const response = await api.get<BackupStatusResponse>('/api/backups/status');
        return response.data;
    },
};

