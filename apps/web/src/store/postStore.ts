import { create } from 'zustand';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '@smm/shared';

export interface Post {
    id: string;
    brandId: string;
    brand_id?: string;
    content: string;
    mediaUrls: string[];
    media_urls?: string;
    scheduledDate?: string;
    scheduled_date?: string;
    status: 'draft' | 'scheduled' | 'published';
    platforms: string[];
    created_at?: string;
}

interface PostState {
    posts: Post[];
    isLoading: boolean;
    error: string | null;
    fetchPosts: () => Promise<void>;
    fetchPostsByBrand: (brandId: string) => Promise<void>;
    addPost: (post: Omit<Post, 'id'>) => Promise<void>;
    updatePost: (id: string, post: Partial<Post>) => Promise<void>;
    deletePost: (id: string) => Promise<void>;
    getPostsByBrand: (brandId: string) => Post[];
}

export const usePostStore = create<PostState>((set, get) => ({
    posts: [],
    isLoading: false,
    error: null,

    fetchPosts: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get<Post[]>(API_ENDPOINTS.POSTS);
            if (res.data) {
                const normalized = res.data.map(p => ({
                    ...p,
                    brandId: p.brandId || p.brand_id || '',
                    mediaUrls: p.mediaUrls || (p.media_urls ? JSON.parse(p.media_urls) : []),
                    scheduledDate: p.scheduledDate || p.scheduled_date,
                    platforms: p.platforms || []
                }));
                set({ posts: normalized, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch posts:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    fetchPostsByBrand: async (brandId: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get<Post[]>(API_ENDPOINTS.POSTS_BY_BRAND(brandId));
            if (res.data) {
                const normalized = res.data.map(p => ({
                    ...p,
                    brandId: p.brandId || p.brand_id || '',
                    mediaUrls: p.mediaUrls || (p.media_urls ? JSON.parse(p.media_urls) : []),
                    scheduledDate: p.scheduledDate || p.scheduled_date,
                    platforms: Array.isArray(p.platforms) ? p.platforms : (typeof p.platforms === 'string' ? JSON.parse(p.platforms) : [])
                }));
                set({ posts: normalized, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch posts:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addPost: async (post) => {
        try {
            const payload = {
                brand_id: post.brandId || post.brand_id,
                content: post.content,
                media_urls: JSON.stringify(post.mediaUrls || []),
                scheduled_date: post.scheduledDate,
                status: post.status,
                platforms: JSON.stringify(post.platforms)
            };
            const res = await api.post<Post>(API_ENDPOINTS.POSTS, payload);
            if (res.data) {
                const normalized = {
                    ...res.data,
                    brandId: res.data.brandId || res.data.brand_id || '',
                    mediaUrls: res.data.mediaUrls || [],
                    platforms: Array.isArray(res.data.platforms) ? res.data.platforms : []
                };
                set((state) => ({ posts: [normalized, ...state.posts] }));
            }
        } catch (error) {
            console.error('Failed to add post:', error);
        }
    },

    updatePost: async (id, updatedPost) => {
        try {
            const res = await api.put<Post>(API_ENDPOINTS.POST_BY_ID(id), updatedPost);
            if (res.data) {
                set((state) => ({
                    posts: state.posts.map((p) =>
                        p.id === id ? { ...p, ...res.data } : p
                    ),
                }));
            }
        } catch (error) {
            console.error('Failed to update post:', error);
        }
    },

    deletePost: async (id) => {
        try {
            await api.delete(API_ENDPOINTS.POST_BY_ID(id));
            set((state) => ({
                posts: state.posts.filter((p) => p.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    },

    getPostsByBrand: (brandId) => {
        return get().posts.filter((p) => p.brandId === brandId);
    },
}));
