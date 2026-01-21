import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '@smm/shared';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, name?: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await api.post<{ user: User; token: string }>(API_ENDPOINTS.AUTH_LOGIN, { email, password });
                    if (res.data) {
                        set({
                            user: res.data.user,
                            token: res.data.token,
                            isAuthenticated: true,
                            isLoading: false
                        });
                        return true;
                    }
                    set({ isLoading: false, error: 'Login failed' });
                    return false;
                } catch (err: any) {
                    set({ isLoading: false, error: err.message || 'Login failed' });
                    return false;
                }
            },

            register: async (email: string, password: string, name?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await api.post<{ user: User; token: string }>(API_ENDPOINTS.AUTH_REGISTER, { email, password, name });
                    if (res.data) {
                        set({
                            user: res.data.user,
                            token: res.data.token,
                            isAuthenticated: true,
                            isLoading: false
                        });
                        return true;
                    }
                    set({ isLoading: false, error: 'Registration failed' });
                    return false;
                } catch (err: any) {
                    set({ isLoading: false, error: err.message || 'Registration failed' });
                    return false;
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            checkAuth: async () => {
                const { token } = get();
                if (!token) {
                    set({ isAuthenticated: false });
                    return;
                }

                try {
                    const res = await api.get<{ user: User }>(API_ENDPOINTS.AUTH_ME);
                    if (res.data) {
                        set({ user: res.data.user, isAuthenticated: true });
                    } else {
                        set({ user: null, token: null, isAuthenticated: false });
                    }
                } catch {
                    set({ user: null, token: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
);
