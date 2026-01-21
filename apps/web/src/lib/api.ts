export interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'https://social-media-manager-api.pages.dev/api';

function getAuthToken(): string | null {
    try {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.state?.token || null;
        }
    } catch {
        // ignore
    }
    return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        try {
            const json = await res.json();
            if (json.error) {
                throw new Error(json.error);
            }
        } catch (e) {
            // ignore
        }
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
