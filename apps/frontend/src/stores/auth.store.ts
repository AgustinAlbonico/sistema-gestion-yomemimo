import { create } from 'zustand';
import { AuthState, LoginResponse, User } from '../types/auth';

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: !!localStorage.getItem('accessToken'),

    setAuth: (data: LoginResponse) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        // Si el response incluye user, actualizarlo; si no, mantener el usuario actual
        const currentUser = get().user;
        set({
            user: data.user ?? currentUser,
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
