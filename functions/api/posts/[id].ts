import { jsonResponse, errorResponse, Env } from '../../utils';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
    try {
        const id = params.id as string;
        const body = await request.json() as any;
        const { content, mediaUrls, scheduledDate, status, platforms } = body;

        // Note: Coalesce logic is trickier with JSON fields if partial updates are sent as raw arrays.
        // For simplicity, we assume full object or at least we update what is provided.
        // Since SQL COALESCE won't work easily with complex transformation requirements (stringify),
        // we might want to fetch first or just assume complete replace if simple. 
        // Let's use dynamic query building or just simpler atomic updates if possible. 
        // Actually, standard sql update:
        // We will perform a fetch first to merge if needed, but for now assuming standard put/patch behavior?
        // Let's go effectively with: Update available fields.

        // Constructing query dynamically or just updating everything provided (assuming undefined check)
        // D1 binding doesn't support "undefined" as "skip".
        // Let's do a quick fetch-merge-update for safety or just update what we can.
        // Simpler approach for this prototype: UPDATE ...

        // Let's assume the frontend sends the relevant fields. 
        // We'll trust the input for now to overwrite. 
        // We need to handle snake_case mapping for DB.

        const current = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
        if (!current) return errorResponse('Post not found', 404);

        const updatedContent = content !== undefined ? content : current.content;
        const updatedMediaUrls = mediaUrls !== undefined ? JSON.stringify(mediaUrls) : current.media_urls;
        const updatedScheduledDate = scheduledDate !== undefined ? scheduledDate : current.scheduled_date;
        const updatedStatus = status !== undefined ? status : current.status;
        const updatedPlatforms = platforms !== undefined ? JSON.stringify(platforms) : current.platforms;

        await env.DB.prepare(`
        UPDATE posts 
        SET content = ?, media_urls = ?, scheduled_date = ?, status = ?, platforms = ? 
        WHERE id = ?
      `)
            .bind(updatedContent, updatedMediaUrls, updatedScheduledDate, updatedStatus, updatedPlatforms, id)
            .run();

        const responseData = {
            id,
            brandId: current.brand_id,
            content: updatedContent,
            mediaUrls: JSON.parse(updatedMediaUrls as string),
            scheduledDate: updatedScheduledDate,
            status: updatedStatus,
            platforms: JSON.parse(updatedPlatforms as string)
        };

        return jsonResponse(responseData, 200);
    } catch (e) {
        return errorResponse('Failed to update post');
    }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
    try {
        const id = params.id as string;
        await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
        return jsonResponse({ deleted: true, id });
    } catch (e) {
        return errorResponse('Failed to delete post');
    }
};
