import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Sale } from './sale.entity';

@Entity('sale_taxes')
export class SaleTax {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'sale_id' })
    saleId!: string;

    @ManyToOne(() => Sale, (sale) => sale.taxes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sale_id' })
    sale!: Sale;

    @Column({ type: 'varchar', length: 100 })
    name!: string; // Ej: "IVA 21%", "Ingresos Brutos"

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => (value ? Number.parseFloat(value) : null),
        },
    })
    percentage!: number | null; // Porcentaje aplicado (si aplica)

    @Column({
        type: 'decimal',
        precision: 20,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number.parseFloat(value) || 0,
        },
    })
    amount!: number; // Monto calculado del impuesto
}
