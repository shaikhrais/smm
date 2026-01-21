import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
    try {
        const id = params.id as string;
        const body = await request.json() as any;
        const { name, description, color } = body;

        await env.DB.prepare('UPDATE brands SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color) WHERE id = ?')
            .bind(name, description, color, id)
            .run();

        return jsonResponse({ id, ...body }, 200);
    } catch (e) {
        return errorResponse('Failed to update brand');
    }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
    try {
        const id = params.id as string;
        await env.DB.prepare('DELETE FROM brands WHERE id = ?').bind(id).run();
        return jsonResponse({ deleted: true, id });
    } catch (e) {
        return errorResponse('Failed to delete brand');
    }
};
