import { jsonResponse, errorResponse, Env } from '../../utils';
import { decryptToken } from '../../crypto';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
    try {
        const id = params.id as string;

        const result = await env.DB.prepare(
            'SELECT * FROM oauth_tokens WHERE id = ?'
        ).bind(id).first();

        if (!result) {
            return errorResponse('Token not found', 404);
        }

        const encryptionKey = env.TOKEN_ENCRYPTION_KEY;
        if (!encryptionKey) {
            return errorResponse('Token encryption not configured', 500);
        }

        // Decrypt tokens for use
        const access_token = await decryptToken(result.access_token_encrypted as string, encryptionKey);
        const refresh_token = result.refresh_token_encrypted
            ? await decryptToken(result.refresh_token_encrypted as string, encryptionKey)
            : null;

        return jsonResponse({
            id: result.id,
            social_account_id: result.social_account_id,
            platform: result.platform,
            access_token,
            refresh_token,
            token_type: result.token_type,
            expires_at: result.expires_at,
            scope: result.scope
        });
    } catch (e) {
        return errorResponse('Failed to fetch OAuth token: ' + (e as Error).message);
    }
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
    try {
        const id = params.id as string;

        await env.DB.prepare('DELETE FROM oauth_tokens WHERE id = ?').bind(id).run();

        return jsonResponse({ deleted: true, id });
    } catch (e) {
        return errorResponse('Failed to delete OAuth token: ' + (e as Error).message);
    }
};
