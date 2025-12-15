import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { CashRegister} from '../types';
import { getPaymentMethodIcon } from '@/features/configuration/utils/payment-method-utils';

interface CashRegisterSummaryProps {
    readonly register: CashRegister;
}

export function CashRegisterSummary({ register }: CashRegisterSummaryProps) {
    const totals = register.totals || [];

    // Calcular totales generales
    const totalBalance = totals.reduce((acc, t) => {
        const initial = Number(t.initialAmount || 0);
        const income = Number(t.totalIncome || 0);
        const expense = Number(t.totalExpense || 0);
        return acc + (initial + income - expense);
    }, 0);

    const totalIncome = totals.reduce((acc, t) => acc + Number(t.totalIncome || 0), 0);
    const totalExpense = totals.reduce((acc, t) => acc + Number(t.totalExpense || 0), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* EN CAJA */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-slate-950 text-white py-3 px-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider">En Caja</CardTitle>
                        <span className="font-bold text-lg">{formatCurrency(totalBalance)}</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {totals.map((t) => {
                            const balance = Number(t.initialAmount || 0) + Number(t.totalIncome || 0) - Number(t.totalExpense || 0);
                            if (balance === 0 && t.paymentMethod?.code !== 'cash') return null;

                            return (
                                <div key={t.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="text-muted-foreground">
                                            {getPaymentMethodIcon(t.paymentMethod?.code || '')}
                                        </div>
                                        <span className="font-medium">{t.paymentMethod?.name}</span>
                                    </div>
                                    <span className="font-mono font-medium">{formatCurrency(balance)}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* INGRESOS */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-emerald-600 text-white py-3 px-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider">Ingresos</CardTitle>
                        <span className="font-bold text-lg">{formatCurrency(totalIncome)}</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {totals.map((t) => {
                            const income = Number(t.totalIncome || 0);
                            if (income === 0) return null;

                            return (
                                <div key={t.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="text-emerald-600">
                                            {getPaymentMethodIcon(t.paymentMethod?.code || '')}
                                        </div>
                                        <span className="font-medium">{t.paymentMethod?.name}</span>
                                    </div>
                                    <span className="font-mono font-medium text-emerald-600">+{formatCurrency(income)}</span>
                                </div>
                            );
                        })}
                        {totalIncome === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Sin ingresos registrados
                            </div>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            {/* EGRESOS */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-rose-600 text-white py-3 px-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider">Egresos</CardTitle>
                        <span className="font-bold text-lg">{formatCurrency(totalExpense)}</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {totals.map((t) => {
                            const expense = Number(t.totalExpense || 0);
                            if (expense === 0) return null;

                            return (
                                <div key={t.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="text-rose-600">
                                            {getPaymentMethodIcon(t.paymentMethod?.code || '')}
                                        </div>
                                        <span className="font-medium">{t.paymentMethod?.name}</span>
                                    </div>
                                    <span className="font-mono font-medium text-rose-600">-{formatCurrency(expense)}</span>
                                </div>
                            );
                        })}
                        {totalExpense === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Sin egresos registrados
                            </div>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
