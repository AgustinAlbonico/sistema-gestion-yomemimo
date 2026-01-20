/**
 * Factory para crear datos de cuenta corriente de prueba
 */

export interface CustomerAccountDTO {
    customerId: string;
    amount: number;
    description: string;
    notes?: string;
    paymentMethodId?: string;
}

let accountCounter = 0;

export const createChargeDTO = (
    customerId: string,
    overrides: Partial<CustomerAccountDTO> = {},
): CustomerAccountDTO => {
    accountCounter += 1;
    return {
        customerId,
        amount: 1500,
        description: `Cargo test ${accountCounter}`,
        ...overrides,
    };
};

export const createPaymentDTO = (
    customerId: string,
    paymentMethodId: string,
    overrides: Partial<CustomerAccountDTO> = {},
): CustomerAccountDTO => {
    accountCounter += 1;
    return {
        customerId,
        paymentMethodId,
        amount: 1000,
        description: `Pago test ${accountCounter}`,
        ...overrides,
    };
};

export const resetCustomerAccountCounter = () => {
    accountCounter = 0;
};
