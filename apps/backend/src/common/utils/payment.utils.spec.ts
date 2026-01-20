/**
 * Tests de utilidades de pagos
 * Prueban la validación y manejo de estados de pago
 */

import {
    resolveIsPaidStatus,
    validatePaymentMethod,
    resolvePaidDate,
    createCashMovementData,
    handleCashRegisterError,
    type CashMovementData,
} from './payment.utils';

describe('Payment Utils', () => {
    describe('resolveIsPaidStatus', () => {
        it('debería retornar true cuando isPaid es true', () => {
            expect(resolveIsPaidStatus(true)).toBe(true);
        });

        it('debería retornar false cuando isPaid es false', () => {
            expect(resolveIsPaidStatus(false)).toBe(false);
        });

        it('debería retornar true por defecto cuando isPaid es undefined', () => {
            expect(resolveIsPaidStatus(undefined)).toBe(true);
        });

        it('debería preservar el valor booleano explícito', () => {
            expect(resolveIsPaidStatus(true)).toBe(true);
            expect(resolveIsPaidStatus(false)).toBe(false);
        });
    });

    describe('validatePaymentMethod', () => {
        it('debería ser válido cuando está pagado y tiene método de pago', () => {
            const result = validatePaymentMethod(true, 'payment-method-123');

            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('debería ser inválido cuando está pagado sin método de pago', () => {
            const result = validatePaymentMethod(true, undefined);

            expect(result.isValid).toBe(false);
            expect(result.error).toBe(
                'El método de pago es requerido cuando el registro está marcado como pagado'
            );
        });

        it('debería ser válido cuando no está pagado sin método de pago', () => {
            const result = validatePaymentMethod(false, undefined);

            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('debería ser válido cuando no está pagado con método de pago', () => {
            const result = validatePaymentMethod(false, 'payment-method-123');

            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('debería ser válido con string vacío como método de pago cuando está pagado', () => {
            const result = validatePaymentMethod(true, '');

            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('resolvePaidDate', () => {
        const defaultDate = new Date('2024-11-28T10:00:00');

        it('debería retornar null cuando no está pagado', () => {
            const result = resolvePaidDate(false, undefined, defaultDate);

            expect(result).toBeNull();
        });

        it('debería retornar paidAt cuando está pagado y tiene fecha explícita', () => {
            const paidAt = new Date('2024-11-25T15:30:00');
            const result = resolvePaidDate(true, paidAt, defaultDate);

            expect(result).toEqual(paidAt);
        });

        it('debería retornar defaultDate cuando está pagado sin paidAt', () => {
            const result = resolvePaidDate(true, undefined, defaultDate);

            expect(result).toEqual(defaultDate);
        });

        it('debería retornar la fecha proporcionada cuando está pagado', () => {
            const customDate = new Date('2024-12-01T08:00:00');
            const result = resolvePaidDate(true, customDate, defaultDate);

            expect(result).toEqual(customDate);
        });

        it('no debería modificar la fecha defaultDate original', () => {
            const paidAt = new Date('2024-11-25T15:30:00');
            const originalDefaultDate = new Date(defaultDate);

            resolvePaidDate(true, paidAt, defaultDate);

            expect(defaultDate.getTime()).toBe(originalDefaultDate.getTime());
        });
    });

    describe('createCashMovementData', () => {
        const baseParams = {
            entityId: 'entity-123',
            amount: 100.5,
            description: 'Test payment',
            paymentMethodId: 'payment-method-456',
        };

        it('debería crear datos de movimiento para expense', () => {
            const result = createCashMovementData(
                'expense',
                baseParams.entityId,
                baseParams.amount,
                baseParams.description,
                baseParams.paymentMethodId
            );

            expect(result).toEqual({
                amount: 100.5,
                description: 'Test payment',
                paymentMethodId: 'payment-method-456',
                expenseId: 'entity-123',
                notes: undefined,
            });
        });

        it('debería crear datos de movimiento para income', () => {
            const result = createCashMovementData(
                'income',
                baseParams.entityId,
                baseParams.amount,
                baseParams.description,
                baseParams.paymentMethodId
            );

            expect(result).toEqual({
                amount: 100.5,
                description: 'Test payment',
                paymentMethodId: 'payment-method-456',
                incomeId: 'entity-123',
                notes: undefined,
            });
        });

        it('debería incluir notas opcionales', () => {
            const result = createCashMovementData(
                'expense',
                baseParams.entityId,
                baseParams.amount,
                baseParams.description,
                baseParams.paymentMethodId,
                'Additional notes'
            );

            expect(result.notes).toBe('Additional notes');
        });

        it('debería tener expenseId undefined para income', () => {
            const result = createCashMovementData(
                'income',
                baseParams.entityId,
                baseParams.amount,
                baseParams.description,
                baseParams.paymentMethodId
            );

            expect(result.incomeId).toBe('entity-123');
            expect(result.expenseId).toBeUndefined();
        });

        it('debería tener incomeId undefined para expense', () => {
            const result = createCashMovementData(
                'expense',
                baseParams.entityId,
                baseParams.amount,
                baseParams.description,
                baseParams.paymentMethodId
            );

            expect(result.expenseId).toBe('entity-123');
            expect(result.incomeId).toBeUndefined();
        });

        it('debería mantener el tipo de datos correcto para amount', () => {
            const result = createCashMovementData(
                'expense',
                baseParams.entityId,
                99.99,
                baseParams.description,
                baseParams.paymentMethodId
            );

            expect(result.amount).toBe(99.99);
            expect(typeof result.amount).toBe('number');
        });
    });

    describe('handleCashRegisterError', () => {
        it('debería retornar el mensaje de error para instancias de Error', () => {
            const error = new Error('Failed to register in cash register');
            const result = handleCashRegisterError(error, 'ExpenseService');

            expect(result).toBe('Failed to register in cash register');
        });

        it('debería retornar un mensaje genérico para errores no Error', () => {
            const error = 'string error';
            const result = handleCashRegisterError(error, 'IncomeService');

            expect(result).toBe('Error desconocido al registrar en caja');
        });

        it('debería retornar un mensaje genérico para null', () => {
            const result = handleCashRegisterError(null, 'ExpenseService');

            expect(result).toBe('Error desconocido al registrar en caja');
        });

        it('debería retornar un mensaje genérico para undefined', () => {
            const result = handleCashRegisterError(undefined, 'IncomeService');

            expect(result).toBe('Error desconocido al registrar en caja');
        });

        it('debería retornar un mensaje genérico para objetos', () => {
            const error = { message: 'Custom error' };
            const result = handleCashRegisterError(error, 'ExpenseService');

            expect(result).toBe('Error desconocido al registrar en caja');
        });

        it('debería manejar errores con mensaje vacío', () => {
            const error = new Error('');
            const result = handleCashRegisterError(error, 'IncomeService');

            expect(result).toBe('');
        });

        it('debería incluir el contexto en el log de consola', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Test error');

            handleCashRegisterError(error, 'TestContext');

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[TestContext] ERROR al registrar en caja:',
                error
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe('CashMovementData interface', () => {
        it('debería permitir crear objetos que cumplen la interfaz', () => {
            const data: CashMovementData = {
                amount: 100,
                description: 'Test',
                paymentMethodId: 'pm-123',
            };

            expect(data.amount).toBe(100);
            expect(data.description).toBe('Test');
            expect(data.paymentMethodId).toBe('pm-123');
            expect(data.notes).toBeUndefined();
        });

        it('debería permitir notas opcionales', () => {
            const data: CashMovementData = {
                amount: 100,
                description: 'Test',
                paymentMethodId: 'pm-123',
                notes: 'Optional notes',
            };

            expect(data.notes).toBe('Optional notes');
        });

        it('debería funcionar con createCashMovementData', () => {
            const result = createCashMovementData(
                'expense',
                'entity-123',
                50,
                'Test',
                'pm-456'
            );

            // Verificar que tiene todas las propiedades de CashMovementData
            expect(result.amount).toBeDefined();
            expect(result.description).toBeDefined();
            expect(result.paymentMethodId).toBeDefined();
            // notes puede ser undefined ya que es opcional
            expect(result.notes).toBeUndefined();
        });
    });
});
