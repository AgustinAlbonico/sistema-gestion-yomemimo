import api from '../lib/axios';
import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ChangePasswordRequest,
    User,
} from '../types/auth';

export const authService = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post('/api/auth/login', data);
        return response.data;
    },

    register: async (
        data: RegisterRequest
    ): Promise<{ id: string; username: string; email?: string }> => {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/api/auth/logout');
    },

    getProfile: async (): Promise<User> => {
        const response = await api.get('/api/auth/profile');
        return response.data;
    },

    changePassword: async (data: ChangePasswordRequest): Promise<void> => {
        await api.post('/api/auth/change-password', data);
    },

    refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
        const response = await api.post('/api/auth/refresh', { refreshToken });
        return response.data;
    },
};
