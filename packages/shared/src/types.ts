// Shared Types for Social Media Manager

export interface Business {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    created_at?: string;
}

export interface Brand {
    id: string;
    business_id: string;
    name: string;
    description?: string;
    color?: string;
}

export interface SocialAccount {
    id: string;
    brand_id: string;
    platform: string;
    username: string;
    handle?: string;
    status: string;
    last_sync?: string;
}

export interface Post {
    id: string;
    brand_id: string;
    content?: string;
    media_urls?: string;
    scheduled_date?: string;
    status?: string;
    platforms?: string;
    created_at?: string;
}

export interface AnalyticsStat {
    id: string;
    brand_id: string;
    date: string;
    impressions: number;
    engagement: number;
    new_followers: number;
    likes: number;
}

export interface Conversation {
    id: string;
    brand_id: string;
    platform: string;
    sender_name?: string;
    sender_avatar?: string;
    last_message?: string;
    unread_count: number;
    updated_at?: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender: 'me' | 'them';
    content?: string;
    created_at?: string;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    created_at?: string;
}
