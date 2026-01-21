import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    // GET /api/messages?conversationId=...
    // Or /api/conversations/[id]/messages
    // Let's stick to query param on messages resource or nested route?
    // User requested `api/messages` (Send/Receive).
    // Let's support `GET /api/messages?conversationId=X`
    try {
        const url = new URL(request.url);
        const conversationId = url.searchParams.get('conversationId');
        if (!conversationId) return errorResponse('Missing conversationId', 400);

        const { results } = await env.DB.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').bind(conversationId).all();

        const mapped = results.map(m => ({
            ...m,
            conversationId: m.conversation_id,
            createdAt: m.created_at,
            conversation_id: undefined,
            created_at: undefined
        }));

        return jsonResponse(mapped);
    } catch (e) {
        // Note: `request` is not in destructuring above. Fix signature.
        return errorResponse('Failed to fetch messages');
    }
};
