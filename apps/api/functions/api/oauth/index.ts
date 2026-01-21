import { jsonResponse, errorResponse, Env } from '../../utils';
import { encryptToken, decryptToken } from '../../crypto';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url);
        const socialAccountId = url.searchParams.get('social_account_id');

        if (!socialAccountId) {
            return errorResponse('social_account_id is required', 400);
        }

        const result = await env.DB.prepare(
            'SELECT * FROM oauth_tokens WHERE social_account_id = ?'
        ).bind(socialAccountId).first();

        if (!result) {
            return jsonResponse(null);
        }

        // Don't decrypt tokens in list response for security
        return jsonResponse({
            id: result.id,
            social_account_id: result.social_account_id,
            platform: result.platform,
            token_type: result.token_type,
            expires_at: result.expires_at,
            scope: result.scope,
            has_access_token: !!result.access_token_encrypted,
            has_refresh_token: !!result.refresh_token_encrypted,
            created_at: result.created_at,
            updated_at: result.updated_at
        });
    } catch (e) {
        return errorResponse('Failed to fetch OAuth tokens: ' + (e as Error).message);
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as any;
        const { social_account_id, platform, access_token, refresh_token, expires_at, scope } = body;

        if (!social_account_id || !access_token) {
            return errorResponse('social_account_id and access_token are required', 400);
        }

        const id = crypto.randomUUID();
        const encryptionKey = env.TOKEN_ENCRYPTION_KEY;

        if (!encryptionKey) {
            return errorResponse('Token encryption not configured', 500);
        }

        // Encrypt tokens
        const access_token_encrypted = await encryptToken(access_token, encryptionKey);
        const refresh_token_encrypted = refresh_token
            ? await encryptToken(refresh_token, encryptionKey)
            : null;

        await env.DB.prepare(`
            INSERT INTO oauth_tokens 
            (id, social_account_id, platform, access_token_encrypted, refresh_token_encrypted, expires_at, scope)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            social_account_id,
            platform,
            access_token_encrypted,
            refresh_token_encrypted,
            expires_at || null,
            scope || null
        ).run();

        return jsonResponse({
            id,
            social_account_id,
            platform,
            expires_at,
            scope,
            message: 'Token stored securely'
        }, 201);
    } catch (e) {
        return errorResponse('Failed to store OAuth token: ' + (e as Error).message);
    }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as any;
        const { id, access_token, refresh_token, expires_at } = body;

        if (!id || !access_token) {
            return errorResponse('id and access_token are required', 400);
        }

        const encryptionKey = env.TOKEN_ENCRYPTION_KEY;
        if (!encryptionKey) {
            return errorResponse('Token encryption not configured', 500);
        }

        const access_token_encrypted = await encryptToken(access_token, encryptionKey);
        const refresh_token_encrypted = refresh_token
            ? await encryptToken(refresh_token, encryptionKey)
            : null;

        await env.DB.prepare(`
            UPDATE oauth_tokens 
            SET access_token_encrypted = ?, refresh_token_encrypted = ?, expires_at = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(access_token_encrypted, refresh_token_encrypted, expires_at || null, id).run();

        return jsonResponse({ id, expires_at, message: 'Token updated successfully' });
    } catch (e) {
        return errorResponse('Failed to update OAuth token: ' + (e as Error).message);
    }
};
