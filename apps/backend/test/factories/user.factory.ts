/**
 * Factory para crear usuarios de prueba
 */

export interface UserDTO {
    username: string;
    email?: string;
    password: string;
    firstName: string;
    lastName: string;
    isActive?: boolean;
}

let userCounter = 0;

/**
 * Crea un DTO de usuario
 */
export const createUserDTO = (overrides: Partial<UserDTO> = {}): UserDTO => {
    userCounter++;
    return {
        username: `testuser${userCounter}`,
        email: `testuser${userCounter}@test.com`,
        password: 'Test123!',
        firstName: 'Test',
        lastName: `User ${userCounter}`,
        isActive: true,
        ...overrides,
    };
};

/**
 * Usuario admin por defecto (para tests que necesitan auth)
 */
export const adminUser: UserDTO = {
    username: 'admin',
    email: 'admin@nexopos.com',
    password: 'Admin123',
    firstName: 'Admin',
    lastName: 'Sistema',
    isActive: true,
};

/**
 * Reset del contador
 */
export const resetUserCounter = () => {
    userCounter = 0;
};
