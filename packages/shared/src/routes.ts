// Centralized UI Routes

export const UI_ROUTES = {
    // Main
    HOME: '/',
    DASHBOARD: '/dashboard',

    // Business Management
    BUSINESSES: '/businesses',
    BUSINESS_DETAIL: (id: string) => `/businesses/${id}`,

    // Brand Management
    BRANDS: '/brands',
    BRAND_DETAIL: (id: string) => `/brands/${id}`,

    // Social Media
    SOCIAL_MEDIA: '/social-media',

    // Posts
    POSTS: '/posts',
    POST_COMPOSER: '/posts/new',
    POST_EDIT: (id: string) => `/posts/${id}/edit`,

    // Engagement
    INBOX: '/inbox',
    CONVERSATION: (id: string) => `/inbox/${id}`,

    // Analytics
    ANALYTICS: '/analytics',

    // Settings
    SETTINGS: '/settings',

    // Debug
    DEBUG: '/debug',

    // Auth (Future)
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
} as const;

export type UiRoute = typeof UI_ROUTES;
