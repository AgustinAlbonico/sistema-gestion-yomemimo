/**
 * Entidad AccountMovement
 * Representa un movimiento en la cuenta corriente (cargo, pago, ajuste, etc.)
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { CustomerAccount } from './customer-account.entity';
import { User } from '../../auth/entities/user.entity';
import { PaymentMethod } from '../../configuration/entities/payment-method.entity';

/**
 * Tipo de movimiento en la cuenta corriente
 */
export enum MovementType {
    CHARGE = 'charge',         // Cargo (venta a crédito)
    PAYMENT = 'payment',       // Pago del cliente
    ADJUSTMENT = 'adjustment', // Ajuste manual
    DISCOUNT = 'discount',     // Descuento/bonificación
    INTEREST = 'interest'      // Interés por mora
}

@Entity('account_movements')
@Index(['accountId'])
@Index(['movementType'])
@Index(['createdAt'])
@Index(['referenceType', 'referenceId'])
export class AccountMovement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    accountId!: string;

    @ManyToOne(() => CustomerAccount, account => account.movements)
    @JoinColumn({ name: 'accountId' })
    account!: CustomerAccount;

    @Column({
        type: 'enum',
        enum: MovementType
    })
    movementType!: MovementType;

    /**
     * Monto del movimiento
     * Convención de signos:
     *  amount > 0  => débito al cliente (cargo, venta, interés)
     *  amount < 0  => crédito al cliente (pago, descuento, ajuste a favor)
     */
    @Column({ type: 'decimal', precision: 20, scale: 2 })
    amount!: number;

    /**
     * Saldo antes del movimiento (para auditoría)
     */
    @Column({ type: 'decimal', precision: 20, scale: 2 })
    balanceBefore!: number;

    /**
     * Saldo después del movimiento (running balance)
     */
    @Column({ type: 'decimal', precision: 20, scale: 2 })
    balanceAfter!: number;

    /**
     * Descripción del movimiento
     */
    @Column({ type: 'varchar', length: 200 })
    description!: string;

    /**
     * Tipo de referencia asociada
     * Ejemplos: 'sale', 'payment', 'manual'
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    referenceType!: string | null;

    /**
     * ID de la entidad relacionada (venta, etc.)
     */
    @Column({ type: 'uuid', nullable: true })
    referenceId!: string | null;

    /**
     * Método de pago (solo para pagos)
     */
    @Column({ type: 'uuid', nullable: true })
    paymentMethodId!: string | null;

    @ManyToOne(() => PaymentMethod, { nullable: true })
    @JoinColumn({ name: 'paymentMethodId' })
    paymentMethod!: PaymentMethod | null;

    /**
     * Notas adicionales
     */
    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    /**
     * Usuario que registró el movimiento
     */
    @Column({ type: 'uuid', nullable: true })
    createdById!: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy!: User | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamp' })
    deletedAt?: Date;
}
