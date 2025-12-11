/**
 * Entidad Expense - Representa un gasto del negocio
 * Incluye gastos operativos como alquiler, servicios, salarios, etc.
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
import { ExpenseCategory } from './expense-category.entity';
import { User } from '../../auth/entities/user.entity';
import { PaymentMethod } from '../../configuration/entities/payment-method.entity';

@Entity('expenses')
@Index(['expenseDate'])
@Index(['isPaid'])
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    description!: string;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    amount!: number;

    @Column({ type: 'date' })
    expenseDate!: Date;

    @ManyToOne(() => ExpenseCategory, (category) => category.expenses, {
        nullable: true,
    })
    @JoinColumn({ name: 'category_id' })
    category!: ExpenseCategory | null;

    @Column({ name: 'category_id', nullable: true })
    categoryId!: string | null;

    @ManyToOne(() => PaymentMethod, { nullable: true })
    @JoinColumn({ name: 'payment_method_id' })
    paymentMethod!: PaymentMethod | null;

    @Column({ name: 'payment_method_id', nullable: true })
    paymentMethodId!: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    receiptNumber!: string | null;

    @Column({ type: 'boolean', default: true })
    isPaid!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    paidAt!: Date | null;

    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy!: User | null;

    @Column({ name: 'created_by', nullable: true })
    createdById!: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt!: Date | null;
}

