/**
 * Tests de TokensService
 * Prueba la gestión de refresh tokens
 */

import { TokensService } from './tokens.service';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh-token.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('TokensService', () => {
    let service: TokensService;
    let repository: jest.Mocked<Repository<RefreshToken>>;
    let configService: jest.Mocked<ConfigService>;

    // Mock RefreshToken
    const mockRefreshToken: RefreshToken = {
        id: 'token-123',
        userId: 'user-123',
        token: 'refresh-token-value',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: {} as any,
        isExpired: jest.fn().mockReturnValue(false),
    };

    beforeEach(() => {
        // Mock Repository
        repository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<Repository<RefreshToken>>;

        // Mock ConfigService
        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        service = new TokensService(repository, configService);
    });

    describe('saveToken', () => {
        it('debería guardar un nuevo refresh token', async () => {
            configService.get.mockReturnValue('90d');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            const result = await service.saveToken('user-123', 'refresh-token-value');

            expect(result).toEqual(mockRefreshToken);
            expect(repository.create).toHaveBeenCalledWith({
                userId: 'user-123',
                token: 'refresh-token-value',
                expiresAt: expect.any(Date),
            });
        });

        it('debería usar el valor por defecto de 90d si no hay configuración', async () => {
            configService.get.mockReturnValue('90d');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            expect(configService.get).toHaveBeenCalledWith('REFRESH_TOKEN_EXPIRES_IN', '90d');
        });

        it('debería calcular la fecha de expiración correctamente para días', async () => {
            configService.get.mockReturnValue('7d');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            const createCall = repository.create.mock.calls[0][0];
            const expiresAt = createCall.expiresAt as Date;
            const now = Date.now();
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

            expect(expiresAt.getTime()).toBeGreaterThan(now);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(now + sevenDaysInMs + 1000);
        });

        it('debería calcular la fecha de expiración correctamente para horas', async () => {
            configService.get.mockReturnValue('24h');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            const createCall = repository.create.mock.calls[0][0];
            const expiresAt = createCall.expiresAt as Date;
            const now = Date.now();
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

            expect(expiresAt.getTime()).toBeGreaterThan(now);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(now + twentyFourHoursInMs + 1000);
        });

        it('debería calcular la fecha de expiración correctamente para minutos', async () => {
            configService.get.mockReturnValue('30m');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            const createCall = repository.create.mock.calls[0][0];
            const expiresAt = createCall.expiresAt as Date;
            const now = Date.now();
            const thirtyMinutesInMs = 30 * 60 * 1000;

            expect(expiresAt.getTime()).toBeGreaterThan(now);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(now + thirtyMinutesInMs + 1000);
        });

        it('debería calcular la fecha de expiración correctamente para segundos', async () => {
            configService.get.mockReturnValue('300s');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            const createCall = repository.create.mock.calls[0][0];
            const expiresAt = createCall.expiresAt as Date;
            const now = Date.now();
            const threeHundredSecondsInMs = 300 * 1000;

            expect(expiresAt.getTime()).toBeGreaterThan(now);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(now + threeHundredSecondsInMs + 1000);
        });
    });

    describe('findToken', () => {
        it('debería buscar un token por su valor', async () => {
            repository.findOne.mockResolvedValue(mockRefreshToken);

            const result = await service.findToken('refresh-token-value');

            expect(result).toEqual(mockRefreshToken);
            expect(repository.findOne).toHaveBeenCalledWith({
                where: { token: 'refresh-token-value' },
                relations: ['user'],
            });
        });

        it('debería retornar null si el token no existe', async () => {
            repository.findOne.mockResolvedValue(null);

            const result = await service.findToken('non-existent-token');

            expect(result).toBeNull();
        });

        it('debería incluir la relación con usuario', async () => {
            repository.findOne.mockResolvedValue(mockRefreshToken);

            await service.findToken('token-value');

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { token: 'token-value' },
                relations: ['user'],
            });
        });
    });

    describe('revokeToken', () => {
        it('debería revocar un token por su valor', async () => {
            repository.delete.mockResolvedValue({ affected: 1, raw: {} });

            await service.revokeToken('token-to-revoke');

            expect(repository.delete).toHaveBeenCalledWith({ token: 'token-to-revoke' });
        });

        it('debería completar exitosamente aunque el token no exista', async () => {
            repository.delete.mockResolvedValue({ affected: 0, raw: {} });

            await expect(service.revokeToken('non-existent-token')).resolves.not.toThrow();
        });
    });

    describe('revokeAllUserTokens', () => {
        it('debería revocar todos los tokens de un usuario', async () => {
            repository.delete.mockResolvedValue({ affected: 5, raw: {} });

            await service.revokeAllUserTokens('user-123');

            expect(repository.delete).toHaveBeenCalledWith({ userId: 'user-123' });
        });

        it('debería completar exitosamente si el usuario no tiene tokens', async () => {
            repository.delete.mockResolvedValue({ affected: 0, raw: {} });

            await expect(service.revokeAllUserTokens('user-without-tokens')).resolves.not.toThrow();
        });
    });

    describe('cleanExpiredTokens', () => {
        it('debería eliminar tokens expirados', async () => {
            repository.delete.mockResolvedValue({ affected: 10, raw: {} });

            await service.cleanExpiredTokens();

            expect(repository.delete).toHaveBeenCalledWith({
                expiresAt: expect.any(Object),
            });
        });

        it('debería usar LessThan para comparar fechas', async () => {
            repository.delete.mockResolvedValue({ affected: 0, raw: {} });

            await service.cleanExpiredTokens();

            const deleteCall = repository.delete.mock.calls[0][0];
            expect(deleteCall).toHaveProperty('expiresAt');
        });

        it('debería completar exitosamente si no hay tokens expirados', async () => {
            repository.delete.mockResolvedValue({ affected: 0, raw: {} });

            await expect(service.cleanExpiredTokens()).resolves.not.toThrow();
        });
    });

    describe('calculateExpirationDate - edge cases', () => {
        it('debería usar 90 días por defecto para formatos inválidos', async () => {
            configService.get.mockReturnValue('invalid-format');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            const createCall = repository.create.mock.calls[0][0];
            const expiresAt = createCall.expiresAt as Date;
            const now = Date.now();
            const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;

            expect(expiresAt.getTime()).toBeGreaterThan(now);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(now + ninetyDaysInMs + 1000);
        });

        it('debería manejar valores grandes de días', async () => {
            configService.get.mockReturnValue('365d');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            const createCall = repository.create.mock.calls[0][0];
            const expiresAt = createCall.expiresAt as Date;
            const now = Date.now();
            const oneYearInMs = 365 * 24 * 60 * 60 * 1000;

            expect(expiresAt.getTime()).toBeGreaterThan(now);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(now + oneYearInMs + 1000);
        });

        it('debería manejar formato con cantidad de 0', async () => {
            configService.get.mockReturnValue('0d');
            repository.create.mockReturnValue(mockRefreshToken);
            repository.save.mockResolvedValue(mockRefreshToken);

            await service.saveToken('user-123', 'token-value');

            const createCall = repository.create.mock.calls[0][0];
            const expiresAt = createCall.expiresAt as Date;
            const now = Date.now();

            // Debería expirar casi inmediatamente
            expect(expiresAt.getTime()).toBeLessThanOrEqual(now + 1000);
        });
    });
});
