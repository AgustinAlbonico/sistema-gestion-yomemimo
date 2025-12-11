import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface TaxType {
    id: string;
    name: string;
    percentage: number | null;
    description?: string;
    isActive: boolean;
}

export const taxTypesApi = {
    getAll: async (): Promise<TaxType[]> => {
        const response = await api.get<TaxType[]>('/api/configuration/tax-types');
        return response.data;
    },
    create: async (data: { name: string; percentage: number; description?: string }): Promise<TaxType> => {
        const response = await api.post<TaxType>('/api/configuration/tax-types', data);
        return response.data;
    },
};

export const useTaxTypes = () => {
    return useQuery({
        queryKey: ['tax-types'],
        queryFn: taxTypesApi.getAll,
    });
};

export const useCreateTaxType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: taxTypesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax-types'] });
        },
    });
};
