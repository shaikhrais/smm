import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        // Fetch conversations with their last message
        // Note: In our schema, `conversations` table stores the last_message content directly for efficiency in lists.
        const { results } = await env.DB.prepare('SELECT * FROM conversations ORDER BY last_message_at DESC').all();

        const mapped = results.map(c => ({
            ...c,
            externalUserId: c.external_user_id,
            userName: c.user_name,
            userAvatar: c.user_avatar,
            lastMessage: c.last_message,
            lastMessageAt: c.last_message_at,
            unreadCount: c.unread_count,
            brandId: c.brand_id,
            // cleanup
            external_user_id: undefined,
            user_name: undefined,
            user_avatar: undefined,
            last_message: undefined,
            last_message_at: undefined,
            unread_count: undefined,
            brand_id: undefined
        }));

        return jsonResponse(mapped);
    } catch (e) {
        return errorResponse('Failed to fetch conversations');
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    // Logic to create a new conversation (e.g. incoming webhook)
    // For this demo, we might not use it from UI, but good to have.
    return jsonResponse({ message: 'Not implemented for UI demo' }, 501);
};
