/**
 * Entidad PurchaseItem - Representa un item/línea de una compra
 * Cada item referencia un producto con cantidad y precio unitario
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { Purchase } from './purchase.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_items')
export class PurchaseItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Purchase, (purchase) => purchase.items, { 
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'purchase_id' })
    purchase!: Purchase;

    @Column({ name: 'purchase_id' })
    purchaseId!: string;

    @ManyToOne(() => Product, { eager: true })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column({ name: 'product_id' })
    productId!: string;

    @Column({ type: 'int' })
    quantity!: number; // Cantidad comprada

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value) || 0,
        },
    })
    unitPrice!: number; // Precio unitario de compra

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value) || 0,
        },
    })
    subtotal!: number; // quantity * unitPrice

    @Column({ type: 'text', nullable: true })
    notes!: string | null; // Notas del item

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Calcular subtotal antes de insertar/actualizar
    @BeforeInsert()
    @BeforeUpdate()
    calculateSubtotal() {
        this.subtotal = this.quantity * this.unitPrice;
    }
}

