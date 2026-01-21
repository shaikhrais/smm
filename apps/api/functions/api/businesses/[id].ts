import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
    try {
        const id = params.id as string;
        const business = await env.DB.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first();

        if (!business) {
            return errorResponse('Business not found', 404);
        }
        return jsonResponse(business);
    } catch (e) {
        return errorResponse('Failed to fetch business');
    }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
    try {
        const id = params.id as string;
        const body = await request.json() as any;
        const { name, industry, website } = body;

        await env.DB.prepare('UPDATE businesses SET name = COALESCE(?, name), industry = COALESCE(?, industry), website = COALESCE(?, website) WHERE id = ?')
            .bind(name, industry, website, id)
            .run();

        return jsonResponse({ id, ...body }, 200);
    } catch (e) {
        return errorResponse('Failed to update business');
    }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
    try {
        const id = params.id as string;
        await env.DB.prepare('DELETE FROM businesses WHERE id = ?').bind(id).run();
        return jsonResponse({ deleted: true, id });
    } catch (e) {
        return errorResponse('Failed to delete business');
    }
};
