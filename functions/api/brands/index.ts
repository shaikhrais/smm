import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM brands').all();
        return jsonResponse(results);
    } catch (e) {
        return errorResponse('Failed to fetch brands');
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as any;
        const id = crypto.randomUUID();
        // Accept both snake_case and camelCase from frontend
        const business_id = body.business_id || body.businessId;
        const { name, description, color } = body;

        if (!business_id || !name) {
            return errorResponse('business_id and name are required', 400);
        }

        await env.DB.prepare('INSERT INTO brands (id, business_id, name, description, color) VALUES (?, ?, ?, ?, ?)')
            .bind(id, business_id, name, description || null, color || null)
            .run();

        const newBrand = { id, business_id, name, description, color };
        return jsonResponse(newBrand, 201);
    } catch (e) {
        return errorResponse('Failed to create brand: ' + (e as Error).message);
    }
};
