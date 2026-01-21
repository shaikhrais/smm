import { jsonResponse, errorResponse, Env } from '../../../utils';

const LINKEDIN_CLIENT_ID = 'YOUR_LINKEDIN_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/linkedin/callback';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    const url = new URL(request.url);
    const brandId = url.searchParams.get('brand_id');

    if (!brandId) {
        return errorResponse('brand_id is required', 400);
    }

    const state = btoa(JSON.stringify({ brandId }));

    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code` +
        `&client_id=${env.LINKEDIN_CLIENT_ID || LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${state}` +
        `&scope=w_member_social%20r_liteprofile`;

    return Response.redirect(linkedinAuthUrl, 302);
};
