import {
    Banknote,
    CreditCard,
    Building,
    Smartphone,
    FileText,
    LucideIcon,
} from 'lucide-react';
import { PaymentMethod } from './types';

/**
 * Iconos para métodos de pago
 */
export const PaymentMethodIcons: Record<PaymentMethod, LucideIcon> = {
    [PaymentMethod.CASH]: Banknote,
    [PaymentMethod.DEBIT_CARD]: CreditCard,
    [PaymentMethod.CREDIT_CARD]: CreditCard,
    [PaymentMethod.TRANSFER]: Building,
    [PaymentMethod.QR]: Smartphone,
    [PaymentMethod.CHECK]: FileText,
    [PaymentMethod.OTHER]: CreditCard,
};
