import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tax_types')
export class TaxType {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    name!: string; // Ej: "IVA 21%", "Ingresos Brutos"

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => (value ? parseFloat(value) : null),
        },
    })
    percentage!: number | null; // Porcentaje por defecto (si aplica)

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;

    @Column({ default: true })
    isActive!: boolean;
}
