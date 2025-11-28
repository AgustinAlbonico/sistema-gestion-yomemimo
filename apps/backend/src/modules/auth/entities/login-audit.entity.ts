import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('login_audits')
export class LoginAudit {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'varchar', length: 255, nullable: true })
    userAgent!: string | null;

    @Column({ type: 'boolean', default: true })
    success!: boolean;

    @Column({ type: 'varchar', nullable: true })
    failureReason!: string | null;

    @CreateDateColumn()
    timestamp!: Date;
}
