import { CashMovement, MovementType } from '../entities/cash-movement.entity';
import { CashRegister } from '../entities/cash-register.entity';

/**
 * Raw movement result from database with prefixed column names
 * (result of getRawMany() with JOINs)
 */
export interface RawMovementResult {
    movement_id: string;
    movement_movementType: MovementType;
    movement_referenceType: string;
    movement_referenceId: string;
    movement_createdAt: Date;
    createdBy_id: string;
    createdBy_firstName: string;
    createdBy_lastName: string;
    amount: string | number;
    description: string;
    paymentMethodName: string;
    paymentMethodCode: string;
}

/**
 * Mapped movement object for frontend consumption
 */
export interface MappedMovement {
    id: string;
    movementType: MovementType;
    referenceType: string;
    referenceId: string;
    createdAt: Date;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        name: string | null;
    };
    amount: number;
    description: string;
    paymentMethod: {
        name: string;
        code: string;
    };
}

/**
 * User with computed name field
 * Note: This is a DTO interface, not extending User entity,
 * because we only need the properties that are serialized from the database
 */
export interface UserWithName {
    id: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    name: string | null;
}

/**
 * Cash register with computed names for openedBy and closedBy
 */
export interface CashRegisterWithNames extends Omit<CashRegister, 'openedBy' | 'closedBy'> {
    openedBy: UserWithName | null;
    closedBy: UserWithName | null;
}

/**
 * Input for registering income from a sale
 */
export interface RegisterIncomeInput {
    salePaymentId: string;
}

/**
 * Input for registering expense payment
 */
export interface RegisterExpensePaymentInput {
    expenseId: string;
    paymentMethodId: string;
}

/**
 * Input for registering income payment
 */
export interface RegisterIncomePaymentInput {
    incomeId: string;
    paymentMethodId: string;
}

/**
 * Input for registering customer account payment
 */
export interface RegisterCustomerAccountPaymentInput {
    accountMovementId: string;
}
