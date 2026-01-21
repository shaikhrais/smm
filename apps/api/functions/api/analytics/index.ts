import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url);
        const brandId = url.searchParams.get('brand_id');

        let query = 'SELECT * FROM analytics_stats';
        let stmt;

        if (brandId) {
            query += ' WHERE brand_id = ?';
            query += ' ORDER BY date DESC LIMIT 30';
            stmt = env.DB.prepare(query).bind(brandId);
        } else {
            query += ' ORDER BY date DESC LIMIT 30';
            stmt = env.DB.prepare(query);
        }

        const { results } = await stmt.all();
        return jsonResponse(results);
    } catch (e) {
        return errorResponse('Failed to fetch analytics');
    }
};
