import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
        const parsedPosts = results.map(post => ({
            ...post,
            mediaUrls: post.media_urls ? JSON.parse(post.media_urls as string) : [],
            platforms: post.platforms ? JSON.parse(post.platforms as string) : [],
            // CamelCase conversion if needed, but keeping simple for now or assuming frontend maps it? 
            // Frontend expects: brandId, scheduledDate. DB has: brand_id, scheduled_date
            // Let's map it explicitly to match frontend expectations.
            brandId: post.brand_id,
            scheduledDate: post.scheduled_date,
            media_urls: undefined, // remove raw keys
            brand_id: undefined,
            scheduled_date: undefined
        }));
        return jsonResponse(parsedPosts);
    } catch (e) {
        return errorResponse('Failed to fetch posts');
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as any;
        const id = crypto.randomUUID();
        // Accept both snake_case and camelCase
        const brand_id = body.brand_id || body.brandId;
        const { content, mediaUrls, scheduledDate, status, platforms } = body;

        if (!brand_id) {
            return errorResponse('brand_id is required', 400);
        }

        await env.DB.prepare('INSERT INTO posts (id, brand_id, content, media_urls, scheduled_date, status, platforms) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(id, brand_id, content, JSON.stringify(mediaUrls || []), scheduledDate || null, status || 'draft', JSON.stringify(platforms || []))
            .run();

        const newPost = { id, brand_id, content, mediaUrls, scheduledDate, status, platforms };
        return jsonResponse(newPost, 201);
    } catch (e) {
        return errorResponse('Failed to create post: ' + (e as Error).message);
    }
};
