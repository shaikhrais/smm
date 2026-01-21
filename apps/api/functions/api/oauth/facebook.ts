import { jsonResponse, errorResponse, Env } from '../../utils';
import { encryptToken } from '../../crypto';
// @ts-ignore
import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
// @ts-ignore
import FB from 'fb';

const FB_CLIENT_ID = 'YOUR_FB_CLIENT_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/facebook/callback';

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[pathParts.length - 1]; // 'authorize' or 'callback'

    if (action === 'authorize') {
        return handleAuthorize(context);
    } else if (action === 'callback') {
        return handleCallback(context);
    }

    return errorResponse('Invalid OAuth action', 404);
};

async function handleAuthorize({ request, env }: { request: Request, env: Env }) {
    const url = new URL(request.url);
    const brandId = url.searchParams.get('brand_id');

    if (!brandId) {
        return errorResponse('brand_id is required', 400);
    }

    // In a real app, you'd use a state parameter to prevent CSRF and pass information
    // For simplicity here, we'll embed brand_id in the state
    const state = btoa(JSON.stringify({ brandId }));

    // Facebook OAuth URL
    const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${state}` +
        `&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish`;

    return Response.redirect(fbAuthUrl, 302);
}

async function handleCallback({ request, env }: { request: Request, env: Env }) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
        return errorResponse(`Facebook OAuth Error: ${error}`);
    }

    if (!code || !stateStr) {
        return errorResponse('Missing code or state', 400);
    }

    try {
        const { brandId } = JSON.parse(atob(stateStr));

        // 1. Exchange code for short-lived access token
        const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
            `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&client_secret=${env.FACEBOOK_CLIENT_SECRET}` +
            `&code=${code}`);

        const tokenData = await tokenRes.json() as any;
        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }

        const accessToken = tokenData.access_token;

        // 2. Exchange for long-lived access token (optional but recommended)
        const longLivedRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
            `grant_type=fb_exchange_token` +
            `&client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}` +
            `&client_secret=${env.FACEBOOK_CLIENT_SECRET}` +
            `&fb_exchange_token=${accessToken}`);

        const longLivedData = await longLivedRes.json() as any;
        const finalToken = longLivedData.access_token || accessToken;

        // 3. Get User/Page Info
        const meRes = await fetch(`https://graph.facebook.com/me?access_token=${finalToken}`);
        const meData = await meRes.json() as any;

        // 4. Store in database
        const socialAccountId = crypto.randomUUID();
        const encryptedToken = await encryptToken(finalToken, env.TOKEN_ENCRYPTION_KEY);

        // Transactional insert (Social Account + Token Info)
        await env.DB.batch([
            env.DB.prepare('INSERT INTO social_accounts (id, brand_id, platform, username, handle, status) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(socialAccountId, brandId, 'facebook', meData.name, `@${meData.id}`, 'connected'),
            env.DB.prepare('INSERT INTO oauth_tokens (id, social_account_id, platform, access_token_encrypted, expires_at) VALUES (?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), socialAccountId, 'facebook', encryptedToken, longLivedData.expires_in ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString() : null)
        ]);

        // 5. Redirect back to UI
        return Response.redirect('https://social-media-manager-ui.pages.dev/social-media?success=true', 302);

    } catch (e: any) {
        return errorResponse(`Failed to process Facebook OAuth: ${e.message}`);
    }
}
