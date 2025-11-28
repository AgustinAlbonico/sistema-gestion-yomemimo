import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class TokensService {
    constructor(
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private configService: ConfigService,
    ) { }

    async saveToken(userId: string, token: string): Promise<RefreshToken> {
        const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d');
        const expiresAt = this.calculateExpirationDate(expiresIn);

        const refreshToken = this.refreshTokenRepository.create({
            userId,
            token,
            expiresAt,
        });

        return this.refreshTokenRepository.save(refreshToken);
    }

    async findToken(token: string): Promise<RefreshToken | null> {
        return this.refreshTokenRepository.findOne({
            where: { token },
            relations: ['user'],
        });
    }

    async revokeToken(token: string): Promise<void> {
        await this.refreshTokenRepository.delete({ token });
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await this.refreshTokenRepository.delete({ userId });
    }

    async cleanExpiredTokens(): Promise<void> {
        await this.refreshTokenRepository.delete({
            expiresAt: LessThan(new Date()),
        });
    }

    private calculateExpirationDate(expiresIn: string): Date {
        const now = new Date();
        const match = expiresIn.match(/^(\d+)([smhd])$/);

        if (!match) {
            // Default to 7 days if invalid format
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        const [, amount, unit] = match;
        const value = parseInt(amount, 10);

        switch (unit) {
            case 's':
                return new Date(now.getTime() + value * 1000);
            case 'm':
                return new Date(now.getTime() + value * 60 * 1000);
            case 'h':
                return new Date(now.getTime() + value * 60 * 60 * 1000);
            case 'd':
                return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
    }
}
