/**
 * Entidad SalePayment - Representa un pago de venta
 * Una venta puede tener múltiples pagos (pago mixto)
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod as PaymentMethodEntity } from '../../configuration/entities/payment-method.entity';
import { Sale } from './sale.entity';

// ... (keep PaymentMethod enum if needed for other things, or remove if unused)

@Entity('sale_payments')
export class SalePayment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'sale_id' })
    saleId!: string;

    @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sale_id' })
    sale!: Sale;

    @ManyToOne(() => PaymentMethodEntity)
    @JoinColumn({ name: 'payment_method_id' })
    paymentMethod!: PaymentMethodEntity;

    @Column({ name: 'payment_method_id' })
    paymentMethodId!: string;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    amount!: number; // Monto de este pago

    @Column({ type: 'int', nullable: true })
    installments!: number | null; // Cantidad de cuotas (si es tarjeta crédito)

    @Column({ type: 'varchar', length: 100, nullable: true })
    cardLastFourDigits!: string | null; // Últimos 4 dígitos de tarjeta

    @Column({ type: 'varchar', length: 100, nullable: true })
    authorizationCode!: string | null; // Código de autorización

    @Column({ type: 'varchar', length: 100, nullable: true })
    referenceNumber!: string | null; // Número de referencia/transacción

    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

