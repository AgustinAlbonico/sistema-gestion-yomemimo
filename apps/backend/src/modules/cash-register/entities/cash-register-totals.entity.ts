import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CashRegister } from './cash-register.entity';
import { PaymentMethod as PaymentMethodEntity } from '../../configuration/entities/payment-method.entity';

@Entity('cash_register_totals')
export class CashRegisterTotals {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => CashRegister, (register) => register.totals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cash_register_id' })
    cashRegister!: CashRegister;

    @ManyToOne(() => PaymentMethodEntity)
    @JoinColumn({ name: 'payment_method_id' })
    paymentMethod!: PaymentMethodEntity;

    @Column({ name: 'payment_method_id' })
    paymentMethodId!: string;

    // Solo para CASH - monto inicial de efectivo
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    initialAmount!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalIncome!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalExpense!: number;

    // inicial + ingresos - egresos
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    expectedAmount!: number;

    // Arqueo al cerrar - Contado manualmente
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    actualAmount?: number;

    // actual - esperado
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    difference?: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
