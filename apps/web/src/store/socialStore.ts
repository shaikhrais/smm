import { create } from 'zustand';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '@smm/shared';

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin';

export interface SocialAccount {
    id: string;
    brandId: string;
    brand_id?: string;
    platform: Platform;
    username: string;
    handle: string;
    avatarUrl?: string;
    status: 'connected' | 'disconnected' | 'expired';
    lastSync: string;
    last_sync?: string;
}

interface SocialState {
    accounts: SocialAccount[];
    isLoading: boolean;
    error: string | null;
    fetchAccounts: () => Promise<void>;
    fetchAccountsByBrand: (brandId: string) => Promise<void>;
    connectAccount: (account: Omit<SocialAccount, 'id' | 'status' | 'lastSync'>) => Promise<void>;
    disconnectAccount: (id: string) => Promise<void>;
    getAccountsByBrand: (brandId: string) => SocialAccount[];
}

export const useSocialStore = create<SocialState>((set, get) => ({
    accounts: [],
    isLoading: false,
    error: null,

    fetchAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get<SocialAccount[]>(API_ENDPOINTS.SOCIAL);
            if (res.data) {
                const normalized = res.data.map(a => ({
                    ...a,
                    brandId: a.brandId || a.brand_id || '',
                    lastSync: a.lastSync || a.last_sync || new Date().toISOString()
                }));
                set({ accounts: normalized, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch social accounts:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    fetchAccountsByBrand: async (brandId: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get<SocialAccount[]>(API_ENDPOINTS.SOCIAL_BY_BRAND(brandId));
            if (res.data) {
                const normalized = res.data.map(a => ({
                    ...a,
                    brandId: a.brandId || a.brand_id || '',
                    lastSync: a.lastSync || a.last_sync || new Date().toISOString()
                }));
                set({ accounts: normalized, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch social accounts:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    connectAccount: async (account) => {
        try {
            const payload = {
                brand_id: account.brandId || account.brand_id,
                platform: account.platform,
                username: account.username,
                handle: account.handle,
                status: 'connected'
            };
            const res = await api.post<SocialAccount>(API_ENDPOINTS.SOCIAL, payload);
            if (res.data) {
                set((state) => ({
                    accounts: [...state.accounts, {
                        ...res.data!,
                        brandId: res.data!.brandId || res.data!.brand_id || '',
                        lastSync: res.data!.lastSync || res.data!.last_sync || new Date().toISOString()
                    }]
                }));
            }
        } catch (error) {
            console.error('Failed to connect account:', error);
        }
    },

    disconnectAccount: async (id) => {
        try {
            await api.delete(API_ENDPOINTS.SOCIAL_BY_ID(id));
            set((state) => ({
                accounts: state.accounts.filter((a) => a.id !== id),
            }));
        } catch (error) {
            console.error('Failed to disconnect account:', error);
        }
    },

    getAccountsByBrand: (brandId) => {
        return get().accounts.filter((a) => a.brandId === brandId);
    },
}));
