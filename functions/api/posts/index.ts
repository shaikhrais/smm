import { jsonResponse, errorResponse, Env } from '../../utils';
import { dispatchPost } from './dispatcher';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url);
        const brandId = url.searchParams.get('brand_id');

        let query = 'SELECT * FROM posts';
        let stmt;

        if (brandId) {
            query += ' WHERE brand_id = ?';
            query += ' ORDER BY created_at DESC';
            stmt = env.DB.prepare(query).bind(brandId);
        } else {
            query += ' ORDER BY created_at DESC';
            stmt = env.DB.prepare(query);
        }

        const { results } = await stmt.all();
        const parsedPosts = results.map(post => ({
            ...post,
            mediaUrls: post.media_urls ? JSON.parse(post.media_urls as string) : [],
            platforms: post.platforms ? JSON.parse(post.platforms as string) : [],
            brandId: post.brand_id,
            scheduledDate: post.scheduled_date
        }));
        return jsonResponse(parsedPosts);
    } catch (e) {
        return errorResponse('Failed to fetch posts');
    }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    try {
        const body = await request.json() as any;
        const id = crypto.randomUUID();
        const brand_id = body.brand_id || body.brandId;
        const { content, mediaUrls, scheduledDate, status, platforms } = body;

        if (!brand_id) {
            return errorResponse('brand_id is required', 400);
        }

        // 1. Save to Database
        await env.DB.prepare('INSERT INTO posts (id, brand_id, content, media_urls, scheduled_date, status, platforms) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(id, brand_id, content, JSON.stringify(mediaUrls || []), scheduledDate || null, status || 'draft', JSON.stringify(platforms || []))
            .run();

        // 2. If status is 'published', dispatch immediately
        let dispatchResults: any[] = [];
        if (status === 'published' || !scheduledDate) {
            dispatchResults = await dispatchPost(env, brand_id, content, platforms || [], mediaUrls || []);
        }

        const newPost = { id, brand_id, content, mediaUrls, scheduledDate, status, platforms, dispatchResults };
        return jsonResponse(newPost, 201);
    } catch (e) {
        return errorResponse('Failed to create post: ' + (e as Error).message);
    }
};
