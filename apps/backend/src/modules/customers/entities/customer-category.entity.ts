/**
 * Entidad para categorías de clientes
 * Permite clasificar clientes por tipo (VIP, Mayorista, Minorista, etc.)
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_categories')
@Index(['name'])
@Index(['isActive'])
export class CustomerCategory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 7, nullable: true })
    color!: string | null;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @OneToMany(() => Customer, (customer) => customer.category)
    customers!: Customer[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

