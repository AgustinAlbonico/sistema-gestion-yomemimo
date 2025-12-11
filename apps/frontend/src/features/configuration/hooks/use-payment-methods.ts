/**
 * React Query hooks para métodos de pago
 */
import { useQuery } from '@tanstack/react-query';
import { paymentMethodsApi } from '../api/payment-methods.api';

export const paymentMethodsKeys = {
    all: ['payment-methods'] as const,
};

export function usePaymentMethods() {
    return useQuery({
        queryKey: paymentMethodsKeys.all,
        queryFn: () => paymentMethodsApi.getAll(),
    });
}
