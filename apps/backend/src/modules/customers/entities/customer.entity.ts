/**
 * Entidad principal de clientes
 * Almacena datos de contacto, documentación y categorización
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { CustomerCategory } from './customer-category.entity';
import { IvaCondition } from '../../../common/enums/iva-condition.enum';

export enum DocumentType {
    DNI = 'DNI',
    CUIT = 'CUIT',
    CUIL = 'CUIL',
    PASAPORTE = 'PASAPORTE',
    OTRO = 'OTRO',
}



@Entity('customers')
@Index(['lastName', 'firstName'])
@Index(['documentNumber'])
@Index(['email'])
@Index(['categoryId'])
@Index(['isActive'])
export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    firstName!: string;

    @Column({ type: 'varchar', length: 100 })
    lastName!: string;

    @Column({
        type: 'enum',
        enum: DocumentType,
        nullable: true,
    })
    documentType!: DocumentType | null;

    @Column({
        type: 'enum',
        enum: IvaCondition,
        nullable: true,
        default: IvaCondition.CONSUMIDOR_FINAL,
    })
    ivaCondition!: IvaCondition | null;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
    documentNumber!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email!: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone!: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    mobile!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    address!: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city!: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    state!: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    postalCode!: string | null;

    @Column({ type: 'uuid', nullable: true })
    categoryId!: string | null;

    @ManyToOne(() => CustomerCategory, { eager: false, nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category!: CustomerCategory | null;

    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Campo virtual para nombre completo
     */
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}

