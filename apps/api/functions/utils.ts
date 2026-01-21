export interface Env {
    DB: D1Database;
    TOKEN_ENCRYPTION_KEY: string;
    JWT_SECRET: string;
    FACEBOOK_CLIENT_ID: string;
    FACEBOOK_CLIENT_SECRET: string;
    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;
    LINKEDIN_CLIENT_ID: string;
    LINKEDIN_CLIENT_SECRET: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}

export const jsonResponse = <T>(data: T, status = 200) => {
    return new Response(JSON.stringify({ data, success: true }), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

export const errorResponse = (message: string, status = 400) => {
    return new Response(JSON.stringify({ error: message, success: false }), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
