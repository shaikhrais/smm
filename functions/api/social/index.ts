import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url);
        const brandId = url.searchParams.get('brand_id');

        let query = 'SELECT * FROM social_accounts';
        let stmt;

        if (brandId) {
            query += ' WHERE brand_id = ?';
            stmt = env.DB.prepare(query).bind(brandId);
        } else {
            stmt = env.DB.prepare(query);
        }

        const { results } = await stmt.all();
        return jsonResponse(results);
    } catch (e) {
        return errorResponse('Failed to fetch social accounts');
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as any;
        const id = crypto.randomUUID();
        // Accept both snake_case and camelCase
        const brand_id = body.brand_id || body.brandId;
        const { platform, username, handle } = body;
        const status = body.status || 'connected';
        const last_sync = new Date().toISOString();

        if (!brand_id || !platform) {
            return errorResponse('brand_id and platform are required', 400);
        }

        await env.DB.prepare('INSERT INTO social_accounts (id, brand_id, platform, username, handle, status, last_sync) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(id, brand_id, platform, username || platform, handle || `@${platform}_user`, status, last_sync)
            .run();

        const newAccount = { id, brand_id, platform, username: username || platform, handle: handle || `@${platform}_user`, status, last_sync };
        return jsonResponse(newAccount, 201);
    } catch (e) {
        return errorResponse('Failed to connect social account: ' + (e as Error).message);
    }
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
    // Note: The previous implementation didn't have a specific ID route for social accounts delete if it was just disconnecting.
    // But RESTful best practice is DELETE /api/social/:id
    // The task said "Implement api/social (Connect/Disconnect)".
    // If the frontend calls DELETE /api/social with an ID likely in query or body? 
    // Wait, the previous mocked implementation had onRequestDelete in api/social/index.ts?
    // Let's check the previous mock file logic. 
    // It was using `params['id']` which implies it might have been expected to be `api/social/:id` or handling delete on the list resource?
    // Actually, Cloudflare Pages routing: `functions/api/social/index.ts` handles `/api/social`. 
    // `onRequestDelete` there would handle `DELETE /api/social`. 
    // If we want `DELETE /api/social/:id`, we need `functions/api/social/[id].ts`.
    // The previous mock implementation was:
    // export const onRequestDelete = async ({ params }: { params: { id: string } }) => { return jsonResponse({ disconnected: true, id: params['id'] }); };
    // `params` are populated from file-based routing. If it's `index.ts`, there are no params unless we use a catch-all or it's implicitly passed?
    // No, `index.ts` won't have `id`.
    // I should create `functions/api/social/[id].ts` for consistency.
    return errorResponse('Method Not Allowed', 405);
};
