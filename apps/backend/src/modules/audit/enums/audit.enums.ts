/**
 * Enum de tipos de entidades auditables
 * Representa las entidades del sistema que pueden ser auditadas
 */
export enum AuditEntityType {
    SALE = 'sale',
    EXPENSE = 'expense',
    INCOME = 'income',
    PURCHASE = 'purchase',
    CASH_REGISTER = 'cash_register',
    CASH_MOVEMENT = 'cash_movement',
}

/**
 * Enum de acciones de auditoría
 * Representa las operaciones que se pueden realizar sobre las entidades
 */
export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    CANCEL = 'CANCEL',
    PAY = 'PAY',
    OPEN = 'OPEN',
    CLOSE = 'CLOSE',
}
