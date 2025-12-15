import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDTO, UpdateUserDTO, UpdateProfileDTO } from './dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(dto: CreateUserDTO | any): Promise<User> {
        const existingUser = await this.findByUsername(dto.username);

        if (existingUser) {
            throw new ConflictException('El nombre de usuario ya está registrado');
        }

        if (dto.email) {
            const existingEmail = await this.findByEmail(dto.email);
            if (existingEmail) {
                throw new ConflictException('El email ya está registrado');
            }
        }

        const user = this.usersRepository.create({
            ...dto,
            passwordHash: dto.password,
        }) as unknown as User;

        return this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
            },
        }) as Promise<User[]>;
    }

    async findOne(id: string, includePassword = false): Promise<User> {
        const query = this.usersRepository.createQueryBuilder('user')
            .where('user.id = :id', { id });

        if (includePassword) {
            query.addSelect('user.passwordHash');
        }

        const user = await query.getOne();

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return user;
    }

    async findByUsername(
        username: string,
        includePassword = false,
    ): Promise<User | null> {
        const query = this.usersRepository.createQueryBuilder('user')
            .where('user.username = :username', { username });

        if (includePassword) {
            query.addSelect('user.passwordHash');
        }

        return query.getOne();
    }

    async findByEmail(
        email: string,
        includePassword = false,
    ): Promise<User | null> {
        const query = this.usersRepository.createQueryBuilder('user')
            .where('user.email = :email', { email });

        if (includePassword) {
            query.addSelect('user.passwordHash');
        }

        return query.getOne();
    }

    async update(id: string, dto: UpdateUserDTO | any): Promise<User> {
        const user = await this.findOne(id);

        if (dto.username && dto.username !== user.username) {
            const existingUser = await this.findByUsername(dto.username);
            if (existingUser) {
                throw new ConflictException('El nombre de usuario ya está en uso');
            }
        }

        if (dto.email && dto.email !== user.email) {
            const existingEmail = await this.findByEmail(dto.email);
            if (existingEmail) {
                throw new ConflictException('El email ya está en uso');
            }
        }

        Object.assign(user, dto);
        return this.usersRepository.save(user);
    }

    async updateProfile(id: string, dto: UpdateProfileDTO): Promise<User> {
        const user = await this.findOne(id);

        if (dto.email && dto.email !== user.email) {
            const existingEmail = await this.findByEmail(dto.email);
            if (existingEmail) {
                throw new ConflictException('El email ya está en uso');
            }
        }

        Object.assign(user, dto);
        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
    }

    async toggleStatus(id: string): Promise<User> {
        const user = await this.findOne(id);
        user.isActive = !user.isActive;
        return this.usersRepository.save(user);
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.usersRepository.update(id, {
            lastLogin: new Date(),
        });
    }
}
