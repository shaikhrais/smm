import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Max-Age": "86400",
        },
    });
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM businesses ORDER BY created_at DESC').all();
        return jsonResponse(results);
    } catch (e) {
        return errorResponse('Failed to fetch businesses');
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as any;
        const id = crypto.randomUUID();
        const { name, industry, website } = body;

        await env.DB.prepare('INSERT INTO businesses (id, name, industry, website) VALUES (?, ?, ?, ?)')
            .bind(id, name, industry, website)
            .run();

        const newBusiness = { id, name, industry, website, created_at: new Date().toISOString() };
        return jsonResponse(newBusiness, 201);
    } catch (e) {
        return errorResponse('Failed to create business: ' + (e as Error).message);
    }
};
