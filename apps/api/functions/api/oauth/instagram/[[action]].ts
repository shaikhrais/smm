import { jsonResponse, errorResponse, Env } from '../../../utils';
import { encryptToken } from '../../../crypto';

const FB_CLIENT_ID = 'YOUR_FB_CLIENT_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/instagram/callback';

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[pathParts.length - 1]; // 'authorize' or 'callback'

    if (action === 'authorize') {
        return handleAuthorize(context);
    } else if (action === 'callback') {
        return handleCallback(context);
    }

    return errorResponse('Invalid action', 400);
};

async function handleAuthorize({ request, env }: { request: Request, env: Env }) {
    const url = new URL(request.url);
    const brandId = url.searchParams.get('brand_id');

    if (!brandId) {
        return errorResponse('brand_id is required', 400);
    }

    const state = btoa(JSON.stringify({ brandId }));

    // Instagram via Facebook Login
    const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${state}` +
        `&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list,business_management`;

    return Response.redirect(fbAuthUrl, 302);
}

async function handleCallback({ request, env }: { request: Request, env: Env }) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?error=${error}`, 302);
    }

    if (!code || !stateStr) {
        return errorResponse('Missing code or state', 400);
    }

    try {
        const { brandId } = JSON.parse(atob(stateStr));

        // 1. Exchange code for short-lived token
        const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
            `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}&` +
            `client_secret=${env.FACEBOOK_CLIENT_SECRET}&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `code=${code}`);

        const tokenData = await tokenRes.json() as any;
        if (tokenData.error) throw new Error(tokenData.error.message);

        const shortLivedToken = tokenData.access_token;

        // 2. Exchange for long-lived token
        const longTokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
            `grant_type=fb_exchange_token&` +
            `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}&` +
            `client_secret=${env.FACEBOOK_CLIENT_SECRET}&` +
            `fb_exchange_token=${shortLivedToken}`);

        const longTokenData = await longTokenRes.json() as any;
        const accessToken = longTokenData.access_token;

        // 3. Get Instagram accounts linked to this user's pages
        const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesRes.json() as any;

        // For simplicity, we'll take the first page that has an IG business account linked
        let igAccountId = '';
        let igName = '';

        for (const page of pagesData.data || []) {
            const igRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
            const igData = await igRes.json() as any;
            if (igData.instagram_business_account) {
                igAccountId = igData.instagram_business_account.id;
                // Get IG name
                const igProfileRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}?fields=username&access_token=${accessToken}`);
                const igProfileData = await igProfileRes.json() as any;
                igName = igProfileData.username;
                break;
            }
        }

        if (!igAccountId) {
            throw new Error('No Instagram Business account found linked to your Facebook Pages.');
        }

        const socialAccountId = crypto.randomUUID();
        const encryptedToken = await encryptToken(accessToken, env.TOKEN_ENCRYPTION_KEY);

        // 4. Store social account
        await env.DB.prepare(
            'INSERT INTO social_accounts (id, brand_id, platform, platform_account_id, name, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(socialAccountId, brandId, 'instagram', igAccountId, igName || 'Instagram Account', 'connected').run();

        // 5. Store OAuth token
        await env.DB.prepare(
            'INSERT INTO oauth_tokens (id, social_account_id, platform, access_token_encrypted, expires_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), socialAccountId, 'instagram', encryptedToken, new Date(Date.now() + (longTokenData.expires_in || 5184000) * 1000).toISOString()).run();

        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?success=true`, 302);
    } catch (e: any) {
        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?error=${encodeURIComponent(e.message)}`, 302);
    }
}
