import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CashMovement } from './cash-movement.entity';
import { CashRegisterTotals } from './cash-register-totals.entity';

export enum CashRegisterStatus {
    OPEN = 'open',
    CLOSED = 'closed',
}

@Entity('cash_registers')
export class CashRegister {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'timestamp' })
    openedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    closedAt?: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    initialAmount!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalIncome!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalExpense!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    expectedAmount?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    actualAmount?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    difference?: number;

    @Column({
        type: 'enum',
        enum: CashRegisterStatus,
        default: CashRegisterStatus.OPEN,
    })
    status!: CashRegisterStatus;

    @Column({ type: 'text', nullable: true })
    openingNotes?: string;

    @Column({ type: 'text', nullable: true })
    closingNotes?: string;

    // Relaciones
    @OneToMany(() => CashMovement, (movement) => movement.cashRegister)
    movements!: CashMovement[];

    @OneToMany(() => CashRegisterTotals, (totals) => totals.cashRegister)
    totals!: CashRegisterTotals[];

    @ManyToOne(() => User)
    @JoinColumn({ name: 'opened_by' })
    openedBy!: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'closed_by' })
    closedBy?: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
