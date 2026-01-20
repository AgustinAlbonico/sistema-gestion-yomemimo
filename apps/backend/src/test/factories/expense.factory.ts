/**
 * Factory para crear gastos de prueba
 */

export interface ExpenseDTO {
    description: string;
    amount: number;
    expenseDate: string;
    categoryId?: string;
    paymentMethodId?: string;
    receiptNumber?: string;
    isPaid?: boolean;
    paidAt?: string;
    notes?: string;
}

let expenseCounter = 0;

export const createExpenseDTO = (overrides: Partial<ExpenseDTO> = {}): ExpenseDTO => {
    expenseCounter += 1;
    return {
        description: `Gasto test ${expenseCounter}`,
        amount: 2500,
        expenseDate: new Date().toISOString().split('T')[0],
        isPaid: true,
        ...overrides,
    };
};

export const resetExpenseCounter = () => {
    expenseCounter = 0;
};
