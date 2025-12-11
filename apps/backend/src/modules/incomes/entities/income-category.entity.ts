/**
 * Entidad IncomeCategory - Representa una categoría de ingreso
 * Permite categorizar ingresos por servicios para mejor análisis y reportes
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Income } from './income.entity';

@Entity('income_categories')
@Index(['name'])
export class IncomeCategory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @OneToMany(() => Income, (income) => income.category)
    incomes!: Income[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt!: Date | null;
}
