/**
 * Factory para crear datos de caja de prueba
 */

export interface OpenCashRegisterDTO {
    initialAmount: number;
    openingNotes?: string;
    adjustmentReason?: string;
}

export interface CloseCashRegisterDTO {
    actualCashAmount: number;
    closingNotes?: string;
}

export interface CashMovementDTO {
    paymentMethodId: string;
    amount: number;
    description: string;
    notes?: string;
}

let cashRegisterCounter = 0;

/**
 * Crea un DTO de apertura de caja
 */
export const createOpenCashRegisterDTO = (
    overrides: Partial<OpenCashRegisterDTO> = {},
): OpenCashRegisterDTO => {
    cashRegisterCounter += 1;
    return {
        initialAmount: 10000,
        openingNotes: `Apertura test ${cashRegisterCounter}`,
        ...overrides,
    };
};

/**
 * Crea un DTO de cierre de caja
 */
export const createCloseCashRegisterDTO = (
    overrides: Partial<CloseCashRegisterDTO> = {},
): CloseCashRegisterDTO => {
    return {
        actualCashAmount: 12000,
        closingNotes: 'Cierre test',
        ...overrides,
    };
};

/**
 * Crea un DTO de movimiento manual
 */
export const createCashMovementDTO = (
    paymentMethodId: string,
    overrides: Partial<CashMovementDTO> = {},
): CashMovementDTO => {
    return {
        paymentMethodId,
        amount: 1500,
        description: 'Movimiento test',
        ...overrides,
    };
};

/**
 * Reset del contador
 */
export const resetCashRegisterCounter = () => {
    cashRegisterCounter = 0;
};
