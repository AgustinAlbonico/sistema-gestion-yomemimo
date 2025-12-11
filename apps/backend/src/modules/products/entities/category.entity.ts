import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
@Index(['name'])
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 7, nullable: true })
    color!: string | null;

    // Porcentaje de ganancia para productos de esta categoría
    // Si está definido, los productos de esta categoría usarán este margen
    // a menos que tengan un margen personalizado (useCustomMargin = true)
    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number | null) => value,
            from: (value: string | null) => value ? parseFloat(value) : null,
        },
    })
    profitMargin!: number | null;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @OneToMany(() => Product, (product) => product.category)
    products!: Product[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
