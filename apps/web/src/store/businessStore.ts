import { create } from 'zustand';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '@smm/shared';

export interface Business {
    id: string;
    name: string;
    industry: string;
    website?: string;
    logo?: string;
    createdAt: string;
    created_at?: string;
}

interface BusinessState {
    businesses: Business[];
    currentBusiness: Business | null;
    isLoading: boolean;
    error: string | null;
    fetchBusinesses: () => Promise<void>;
    addBusiness: (business: Omit<Business, 'id' | 'createdAt'>) => Promise<void>;
    updateBusiness: (id: string, business: Partial<Business>) => Promise<void>;
    deleteBusiness: (id: string) => Promise<void>;
    setCurrentBusiness: (id: string) => void;
}

export const useBusinessStore = create<BusinessState>((set) => ({
    businesses: [],
    currentBusiness: null,
    isLoading: false,
    error: null,
    fetchBusinesses: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get<Business[]>(API_ENDPOINTS.BUSINESSES);
            if (res.data) {
                // Normalize createdAt field
                const normalized = res.data.map(b => ({
                    ...b,
                    createdAt: b.createdAt || b.created_at || new Date().toISOString()
                }));
                set({ businesses: normalized, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch businesses:', error);
            set({ error: error.message, isLoading: false });
        }
    },
    addBusiness: async (business) => {
        try {
            const res = await api.post<Business>(API_ENDPOINTS.BUSINESSES, business);
            if (res.data) {
                set((state) => ({
                    businesses: [...state.businesses, {
                        ...res.data!,
                        createdAt: res.data!.createdAt || res.data!.created_at || new Date().toISOString()
                    }]
                }));
            }
        } catch (error) {
            console.error('Failed to add business:', error);
        }
    },
    updateBusiness: async (id, updatedBusiness) => {
        try {
            const res = await api.put<Business>(API_ENDPOINTS.BUSINESS_BY_ID(id), updatedBusiness);
            if (res.data) {
                set((state) => ({
                    businesses: state.businesses.map((b) =>
                        b.id === id ? { ...b, ...res.data } : b
                    ),
                }));
            }
        } catch (error) {
            console.error('Failed to update business:', error);
        }
    },
    deleteBusiness: async (id) => {
        try {
            await api.delete(API_ENDPOINTS.BUSINESS_BY_ID(id));
            set((state) => ({
                businesses: state.businesses.filter((b) => b.id !== id),
                currentBusiness: state.currentBusiness?.id === id ? null : state.currentBusiness,
            }));
        } catch (error) {
            console.error('Failed to delete business:', error);
        }
    },
    setCurrentBusiness: (id) =>
        set((state) => ({
            currentBusiness: state.businesses.find((b) => b.id === id) || null,
        })),
}));
