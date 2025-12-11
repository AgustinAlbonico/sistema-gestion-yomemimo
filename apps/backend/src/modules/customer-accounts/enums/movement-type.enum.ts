/**
 * Tipos de movimientos en cuenta corriente
 */
export enum MovementType {
    CHARGE = 'charge',         // Cargo (venta)
    PAYMENT = 'payment',       // Pago
    ADJUSTMENT = 'adjustment', // Ajuste
    DISCOUNT = 'discount',     // Descuento/bonificación
    INTEREST = 'interest',     // Interés por mora
}
