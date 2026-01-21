import { jsonResponse, errorResponse, Env } from '../../../utils';

const FB_CLIENT_ID = 'YOUR_FB_CLIENT_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/facebook/callback';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    const url = new URL(request.url);
    const brandId = url.searchParams.get('brand_id');

    if (!brandId) {
        return errorResponse('brand_id is required', 400);
    }

    const state = btoa(JSON.stringify({ brandId }));

    const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${state}` +
        `&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list,business_management`;

    return Response.redirect(fbAuthUrl, 302);
};
