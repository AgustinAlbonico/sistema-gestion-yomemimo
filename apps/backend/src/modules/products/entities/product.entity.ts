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
@Index(['isActive'])
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

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
            from: (value: string) => Number.parseFloat(value),
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
            from: (value: string) => Number.parseFloat(value),
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
            from: (value: string) => value ? Number.parseFloat(value) : null,
        },
    })
    profitMargin?: number | null;

    @Column({ type: 'int', default: 0 })
    stock!: number;

    // Relación ManyToOne: Un producto pertenece a UNA categoría (opcional)
    @Index()
    @Column({ type: 'uuid', nullable: true })
    categoryId!: string | null;

    @ManyToOne(() => Category, (category) => category.products, { eager: false, nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category!: Category | null;

    // Indica si el producto usa un margen de ganancia personalizado (no afectado por actualización masiva)
    @Column({ type: 'boolean', default: false })
    useCustomMargin!: boolean;

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
