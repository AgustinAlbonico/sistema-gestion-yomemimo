/**
 * Entidad ExpenseCategory - Representa una categoría de gasto
 * Permite categorizar gastos para mejor análisis y reportes
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Expense } from './expense.entity';

@Entity('expense_categories')
@Index(['name'])
export class ExpenseCategory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    name!: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: false })
    isRecurring!: boolean;

    @OneToMany(() => Expense, (expense) => expense.category)
    expenses!: Expense[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

