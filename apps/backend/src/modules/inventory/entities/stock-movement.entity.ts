import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

/**
 * Tipos de movimiento de stock
 */
export enum StockMovementType {
    IN = 'IN',   // Entrada de stock
    OUT = 'OUT', // Salida de stock
}

/**
 * Entidad para registrar movimientos de inventario
 */
@Entity('stock_movements')
@Index(['productId'])
@Index(['date'])
@Index(['type'])
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    productId!: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column({
        type: 'enum',
        enum: StockMovementType,
    })
    type!: StockMovementType;

    @Column('int')
    quantity!: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    cost?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    provider?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'timestamp' })
    date!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
