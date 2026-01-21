import { jsonResponse, errorResponse, Env } from '../../utils';
import { getAuthToken, verifyToken } from '../../auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const token = getAuthToken(request);
        if (!token) {
            return errorResponse('Unauthorized', 401);
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return errorResponse('Invalid token', 401);
        }

        // Get user details
        const user = await env.DB.prepare(
            'SELECT id, email, name, created_at FROM users WHERE id = ?'
        ).bind(payload.userId).first();

        if (!user) {
            return errorResponse('User not found', 404);
        }

        return jsonResponse({ user });
    } catch (e: any) {
        return errorResponse('Failed to get user: ' + e.message, 500);
    }
};
