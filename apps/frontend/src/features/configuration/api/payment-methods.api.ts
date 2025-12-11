import { api } from '@/lib/axios';

export interface PaymentMethod {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
}

export const paymentMethodsApi = {
    getAll: async () => {
        const { data } = await api.get<PaymentMethod[]>('/api/configuration/payment-methods');
        return data;
    },

    seed: async () => {
        const { data } = await api.post<{ created: number }>('/api/configuration/payment-methods/seed');
        return data;
    },
};
