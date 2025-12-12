/**
 * Entidad SaleItem - Representa un item de venta
 * Cada item tiene un producto, cantidad y precio
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('sale_items')
export class SaleItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'sale_id' })
    saleId!: string;

    @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sale_id' })
    sale!: Sale;

    @Column({ name: 'product_id' })
    productId!: string;

    @ManyToOne(() => Product, { eager: true })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column({ type: 'varchar', length: 50, nullable: true })
    productCode!: string | null; // Código del producto (snapshot)

    @Column({ type: 'varchar', length: 200 })
    productDescription!: string; // Descripción del producto (snapshot)

    @Column({ type: 'int' })
    quantity!: number;

    @Column({ type: 'varchar', length: 20, default: 'unidades' })
    unitOfMeasure!: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    unitPrice!: number; // Precio de venta unitario

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    discount!: number; // Descuento por item

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    discountPercent!: number; // Porcentaje de descuento

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    subtotal!: number; // (quantity * unitPrice) - discount

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Calcula el subtotal antes de insertar/actualizar
     */
    @BeforeInsert()
    @BeforeUpdate()
    calculateSubtotal() {
        this.subtotal = (this.quantity * this.unitPrice) - this.discount;
    }
}

