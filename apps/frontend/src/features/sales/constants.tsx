import {
    Banknote,
    CreditCard,
    Building,
    Smartphone,
    FileText,
} from 'lucide-react';
import { PaymentMethod } from './types';

/**
 * Iconos para métodos de pago
 */
export const PaymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
    [PaymentMethod.CASH]: <Banknote className="h-4 w-4" />,
    [PaymentMethod.DEBIT_CARD]: <CreditCard className="h-4 w-4" />,
    [PaymentMethod.CREDIT_CARD]: <CreditCard className="h-4 w-4" />,
    [PaymentMethod.TRANSFER]: <Building className="h-4 w-4" />,
    [PaymentMethod.QR]: <Smartphone className="h-4 w-4" />,
    [PaymentMethod.CHECK]: <FileText className="h-4 w-4" />,
    [PaymentMethod.OTHER]: <CreditCard className="h-4 w-4" />,
};
