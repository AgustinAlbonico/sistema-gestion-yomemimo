export interface User {
    id: string;
    username: string;
    email?: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email?: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (data: LoginResponse) => void;
    setUser: (user: User) => void;
    logout: () => void;
}
