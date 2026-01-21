import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    selectedBusinessId: string;
    selectedBrandId: string;
    setSelectedBusinessId: (id: string) => void;
    setSelectedBrandId: (id: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            selectedBusinessId: '',
            selectedBrandId: '',
            setSelectedBusinessId: (id: string) => set({ selectedBusinessId: id }),
            setSelectedBrandId: (id: string) => set({ selectedBrandId: id }),
        }),
        {
            name: 'app-storage',
        }
    )
);
