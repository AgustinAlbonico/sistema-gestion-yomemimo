/**
 * Estados posibles de una cuenta corriente
 */
export enum AccountStatus {
    ACTIVE = 'active',       // Cuenta activa
    SUSPENDED = 'suspended', // Cuenta suspendida (morosidad)
    CLOSED = 'closed',       // Cuenta cerrada
}
