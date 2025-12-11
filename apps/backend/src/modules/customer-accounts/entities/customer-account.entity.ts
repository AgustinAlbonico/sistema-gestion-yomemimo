/**
 * Entidad CustomerAccount
 * Representa la cuenta corriente de un cliente
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { AccountMovement } from './account-movement.entity';

/**
 * Estado de la cuenta corriente
 */
export enum AccountStatus {
    ACTIVE = 'active',       // Cuenta activa
    SUSPENDED = 'suspended', // Cuenta suspendida (morosidad)
    CLOSED = 'closed'        // Cuenta cerrada
}

@Entity('customer_accounts')
@Index(['status'])
@Index(['balance'])
@Index(['daysOverdue'])
export class CustomerAccount {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    customerId!: string;

    @OneToOne(() => Customer)
    @JoinColumn({ name: 'customerId' })
    customer!: Customer;

    /**
     * Saldo actual de la cuenta
     * Convención:
     *  balance > 0  => el cliente le debe al negocio
     *  balance = 0  => cuenta saldada
     *  balance < 0  => el negocio le debe al cliente (saldo a favor)
     */
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    balance!: number;

    /**
     * Límite de crédito del cliente
     * 0 = sin límite establecido
     */
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    creditLimit!: number;

    @Column({
        type: 'enum',
        enum: AccountStatus,
        default: AccountStatus.ACTIVE
    })
    status!: AccountStatus;

    /**
     * Días de mora (se actualiza diariamente)
     */
    @Column({ type: 'int', default: 0 })
    daysOverdue!: number;

    /**
     * Última fecha de pago
     */
    @Column({ type: 'date', nullable: true })
    lastPaymentDate!: Date | null;

    /**
     * Última fecha de compra/cargo
     */
    @Column({ type: 'date', nullable: true })
    lastPurchaseDate!: Date | null;

    /**
     * Movimientos de la cuenta
     */
    @OneToMany(() => AccountMovement, movement => movement.account)
    movements!: AccountMovement[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamp' })
    deletedAt?: Date;
}
