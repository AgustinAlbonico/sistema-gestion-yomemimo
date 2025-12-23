import {
    Banknote,
    CreditCard,
    Landmark,
    QrCode,
    FileCheck,
    MoreHorizontal
} from 'lucide-react';

export const getPaymentMethodIcon = (code: string, className = "h-4 w-4") => {
    switch (code) {
        case 'cash': return <Banknote className={className} />;
        case 'debit_card': return <CreditCard className={className} />;
        case 'credit_card': return <CreditCard className={className} />;
        case 'transfer': return <Landmark className={className} />;
        case 'qr': return <QrCode className={className} />;
        case 'check': return <FileCheck className={className} />;
        case 'wallet': return <QrCode className={className} />; // Legacy support
        default: return <MoreHorizontal className={className} />;
    }
};

export const getPaymentMethodColor = (code: string) => {
    switch (code) {
        case 'cash': return 'bg-emerald-500 hover:bg-emerald-600 text-white';
        case 'debit_card': return 'bg-blue-500 hover:bg-blue-600 text-white';
        case 'credit_card': return 'bg-violet-500 hover:bg-violet-600 text-white';
        case 'transfer': return 'bg-cyan-500 hover:bg-cyan-600 text-white';
        case 'qr': return 'bg-orange-500 hover:bg-orange-600 text-white';
        case 'check': return 'bg-slate-500 hover:bg-slate-600 text-white';
        case 'wallet': return 'bg-pink-500 hover:bg-pink-600 text-white';
        default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
};

export const getPaymentMethodLabel = (code: string) => {
    switch (code) {
        case 'cash': return 'Efectivo';
        case 'debit_card': return 'Débito';
        case 'credit_card': return 'Crédito';
        case 'transfer': return 'Transferencia';
        case 'qr': return 'QR / Billetera Virtual';
        case 'check': return 'Cheque';
        case 'wallet': return 'QR / Billetera Virtual'; // Legacy support
        default: return 'Otro';
    }
};
