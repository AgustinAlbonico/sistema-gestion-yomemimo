/**
 * Factory para crear ingresos de prueba
 */

export interface IncomeDTO {
    description: string;
    amount: number;
    incomeDate: string;
    categoryId?: string;
    customerId?: string;
    customerName?: string;
    isOnAccount?: boolean;
    paymentMethodId?: string;
    receiptNumber?: string;
    isPaid?: boolean;
    notes?: string;
}

let incomeCounter = 0;

export const createIncomeDTO = (overrides: Partial<IncomeDTO> = {}): IncomeDTO => {
    incomeCounter += 1;
    return {
        description: `Ingreso test ${incomeCounter}`,
        amount: 5000,
        incomeDate: new Date().toISOString().split('T')[0],
        isOnAccount: false,
        isPaid: true,
        ...overrides,
    };
};

export const resetIncomeCounter = () => {
    incomeCounter = 0;
};
