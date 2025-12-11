/**
 * Entidad Income - Representa un ingreso por servicio
 * Gestiona ingresos de servicios con cliente opcional y cuenta corriente
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
import { IncomeCategory } from './income-category.entity';
import { User } from '../../auth/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { PaymentMethod } from '../../configuration/entities/payment-method.entity';

@Entity('incomes')
@Index(['incomeDate'])
@Index(['isPaid'])
export class Income {
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
    incomeDate!: Date;

    // Categoría del ingreso
    @ManyToOne(() => IncomeCategory, (category) => category.incomes, {
        nullable: true,
    })
    @JoinColumn({ name: 'category_id' })
    category!: IncomeCategory | null;

    @Column({ name: 'category_id', nullable: true })
    categoryId!: string | null;

    // Cliente asociado (opcional - puede ser "Consumidor Final")
    @ManyToOne(() => Customer, { nullable: true })
    @JoinColumn({ name: 'customer_id' })
    customer!: Customer | null;

    @Column({ name: 'customer_id', nullable: true })
    customerId!: string | null;

    // Nombre del cliente si no hay cliente registrado
    @Column({ type: 'varchar', length: 200, nullable: true })
    customerName!: string | null;

    // Si es a cuenta corriente
    @Column({ type: 'boolean', default: false })
    isOnAccount!: boolean;

    // Método de pago (si no es a cuenta corriente)
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
