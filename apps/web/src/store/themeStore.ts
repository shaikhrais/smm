import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'system';

    // Apply the theme immediately
    const applyTheme = (theme: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    };

    // Initial application of theme
    if (typeof window !== 'undefined') {
        applyTheme(initialTheme);
    }

    return {
        theme: initialTheme,
        setTheme: (theme) => {
            localStorage.setItem('theme', theme);
            applyTheme(theme);
            set({ theme });
        },
    };
});
