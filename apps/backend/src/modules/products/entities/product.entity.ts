import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
@Index(['name'])
@Index(['barcode'])
@Index(['categoryId'])
@Index(['isActive'])
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    sku?: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    barcode?: string | null;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    cost!: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    price?: number | null;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => value ? parseFloat(value) : null,
        },
    })
    profitMargin?: number | null;

    @Column({ type: 'int', default: 0 })
    stock!: number;

    @Column({ type: 'int', default: 0 })
    minStock!: number;

    @Column({ type: 'uuid', nullable: true })
    categoryId!: string;

    @ManyToOne(() => Category, { eager: false, nullable: true })
    @JoinColumn({ name: 'category_id' })
    category!: Category;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // Hook para calcular precio si hay margen de ganancia
    @BeforeInsert()
    @BeforeUpdate()
    calculatePriceFromMargin() {
        if (this.profitMargin && this.cost) {
            this.price = this.cost * (1 + this.profitMargin / 100);
            this.price = Math.round(this.price * 100) / 100; // Redondear a 2 decimales
        }
    }
}
