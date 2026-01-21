import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
    try {
        const id = params.id as string;

        if (!id) {
            return errorResponse('Account ID is required', 400);
        }

        await env.DB.prepare('DELETE FROM social_accounts WHERE id = ?')
            .bind(id)
            .run();

        return jsonResponse({ deleted: true, id });
    } catch (e) {
        return errorResponse('Failed to disconnect social account: ' + (e as Error).message);
    }
};

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
    try {
        const id = params.id as string;
        const result = await env.DB.prepare('SELECT * FROM social_accounts WHERE id = ?').bind(id).first();

        if (!result) {
            return errorResponse('Social account not found', 404);
        }

        return jsonResponse(result);
    } catch (e) {
        return errorResponse('Failed to fetch social account');
    }
};
