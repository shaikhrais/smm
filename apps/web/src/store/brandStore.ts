import { create } from 'zustand';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '@smm/shared';

export interface Brand {
    id: string;
    businessId: string;
    business_id?: string;
    name: string;
    description?: string;
    logo?: string;
    color?: string;
}

interface BrandState {
    brands: Brand[];
    currentBrand: Brand | null;
    isLoading: boolean;
    error: string | null;
    fetchBrands: () => Promise<void>;
    fetchBrandsByBusiness: (businessId: string) => Promise<void>;
    addBrand: (brand: Omit<Brand, 'id'>) => Promise<void>;
    updateBrand: (id: string, brand: Partial<Brand>) => Promise<void>;
    deleteBrand: (id: string) => Promise<void>;
    setCurrentBrand: (id: string) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
    brands: [],
    currentBrand: null,
    isLoading: false,
    error: null,
    fetchBrands: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get<Brand[]>(API_ENDPOINTS.BRANDS);
            if (res.data) {
                const normalized = res.data.map(b => ({
                    ...b,
                    businessId: b.businessId || b.business_id || ''
                }));
                set({ brands: normalized, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch brands:', error);
            set({ error: error.message, isLoading: false });
        }
    },
    fetchBrandsByBusiness: async (businessId: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get<Brand[]>(API_ENDPOINTS.BRANDS_BY_BUSINESS(businessId));
            if (res.data) {
                const normalized = res.data.map(b => ({
                    ...b,
                    businessId: b.businessId || b.business_id || ''
                }));
                set({ brands: normalized, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch brands:', error);
            set({ error: error.message, isLoading: false });
        }
    },
    addBrand: async (brand) => {
        try {
            const payload = {
                name: brand.name,
                description: brand.description,
                business_id: brand.businessId || brand.business_id,
                color: brand.color
            };
            const res = await api.post<Brand>(API_ENDPOINTS.BRANDS, payload);
            if (res.data) {
                set((state) => ({
                    brands: [...state.brands, {
                        ...res.data!,
                        businessId: res.data!.businessId || res.data!.business_id || ''
                    }]
                }));
            }
        } catch (error) {
            console.error('Failed to add brand:', error);
        }
    },
    updateBrand: async (id, updatedBrand) => {
        try {
            const res = await api.put<Brand>(API_ENDPOINTS.BRAND_BY_ID(id), updatedBrand);
            if (res.data) {
                set((state) => ({
                    brands: state.brands.map((b) =>
                        b.id === id ? { ...b, ...res.data } : b
                    ),
                }));
            }
        } catch (error) {
            console.error('Failed to update brand:', error);
        }
    },
    deleteBrand: async (id) => {
        try {
            await api.delete(API_ENDPOINTS.BRAND_BY_ID(id));
            set((state) => ({
                brands: state.brands.filter((b) => b.id !== id),
                currentBrand: state.currentBrand?.id === id ? null : state.currentBrand,
            }));
        } catch (error) {
            console.error('Failed to delete brand:', error);
        }
    },
    setCurrentBrand: (id) =>
        set((state) => ({
            currentBrand: state.brands.find((b) => b.id === id) || null,
        })),
}));
