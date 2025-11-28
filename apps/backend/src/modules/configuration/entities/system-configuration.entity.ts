import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Configuración global del sistema
 */
@Entity('system_configuration')
export class SystemConfiguration {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('decimal', { precision: 5, scale: 2, default: 30.00 })
    defaultProfitMargin!: number;

    @Column('int', { default: 5 })
    minStockAlert!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
