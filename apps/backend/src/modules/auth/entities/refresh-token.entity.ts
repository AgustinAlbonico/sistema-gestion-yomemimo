import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
@Index(['token'])
@Index(['expiresAt'])
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'varchar', length: 500, unique: true })
    token!: string;

    @Column({ type: 'timestamp' })
    expiresAt!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }
}
