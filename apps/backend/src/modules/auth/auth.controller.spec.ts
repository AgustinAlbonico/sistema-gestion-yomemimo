/**
 * Tests unitarios para AuthController
 * Cubre: login
 * Enfoque: Pruebas de comportamiento usando mocks directos
 */
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<AuthService>;

    beforeEach(() => {
        // Crear mock del AuthService
        authService = {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            getProfile: jest.fn(),
            changePassword: jest.fn(),
        } as unknown as jest.Mocked<AuthService>;

        controller = new AuthController(authService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login()', () => {
        const mockUserAgent = 'Mozilla/5.0 Test Browser';

        it('debe llamar a authService.login con las credenciales y userAgent', async () => {
            const loginDto = {
                username: 'testuser',
                password: 'Test123!',
            };

            const expectedResponse = {
                user: {
                    id: 'user-uuid-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                },
                accessToken: 'mock-jwt-token',
                refreshToken: 'mock-refresh-token',
            };

            authService.login.mockResolvedValue(expectedResponse as never);

            const result = await controller.login(loginDto, mockUserAgent);

            expect(authService.login).toHaveBeenCalledWith(loginDto, mockUserAgent);
            expect(result).toEqual(expectedResponse);
        });

        it('debe propagar error de authService', async () => {
            const loginDto = {
                username: 'testuser',
                password: 'Test123!',
            };

            const error = new Error('Database connection failed');
            authService.login.mockRejectedValue(error);

            await expect(controller.login(loginDto, mockUserAgent)).rejects.toThrow(error);
            expect(authService.login).toHaveBeenCalledWith(loginDto, mockUserAgent);
        });
    });
});
