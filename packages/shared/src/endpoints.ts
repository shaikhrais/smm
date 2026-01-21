// Centralized API Endpoints
// Note: BASE_URL already includes /api, so endpoints should NOT include /api prefix

export const API_ENDPOINTS = {
    // Businesses
    BUSINESSES: '/businesses',
    BUSINESS_BY_ID: (id: string) => `/businesses/${id}`,

    // Brands
    BRANDS: '/brands',
    BRAND_BY_ID: (id: string) => `/brands/${id}`,
    BRANDS_BY_BUSINESS: (businessId: string) => `/brands?business_id=${businessId}`,

    // Social Accounts
    SOCIAL: '/social',
    SOCIAL_BY_ID: (id: string) => `/social/${id}`,
    SOCIAL_BY_BRAND: (brandId: string) => `/social?brand_id=${brandId}`,

    // Posts
    POSTS: '/posts',
    POST_BY_ID: (id: string) => `/posts/${id}`,
    POSTS_BY_BRAND: (brandId: string) => `/posts?brand_id=${brandId}`,

    // Analytics
    ANALYTICS: '/analytics',
    ANALYTICS_BY_BRAND: (brandId: string) => `/analytics?brand_id=${brandId}`,

    // Conversations & Messages
    CONVERSATIONS: '/conversations',
    CONVERSATION_BY_ID: (id: string) => `/conversations/${id}`,
    MESSAGES: '/messages',
    MESSAGES_BY_CONVERSATION: (convId: string) => `/messages?conversation_id=${convId}`,

    // Auth
    AUTH_REGISTER: '/auth/register',
    AUTH_LOGIN: '/auth/login',
    AUTH_ME: '/auth/me',

    // OAuth Tokens
    OAUTH_TOKENS: '/oauth',
    OAUTH_TOKEN_BY_ID: (id: string) => `/oauth/${id}`,
    OAUTH_TOKEN_BY_ACCOUNT: (socialAccountId: string) => `/oauth?social_account_id=${socialAccountId}`,
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS;
