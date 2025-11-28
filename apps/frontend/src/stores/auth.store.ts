import { create } from 'zustand';
import { AuthState, LoginResponse, User } from '../types/auth';

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: !!localStorage.getItem('accessToken'),

    setAuth: (data: LoginResponse) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({
            user: data.user as User,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
        });
    },

    setUser: (user: User) => {
        set({ user });
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
        });
    },
}));
