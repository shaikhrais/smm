import { jsonResponse, errorResponse, Env } from '../../../utils';
import { encryptToken } from '../../../crypto';

const FB_CLIENT_ID = 'YOUR_FB_CLIENT_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/instagram/callback';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?error=${encodeURIComponent(error)}`, 302);
    }

    if (!code || !stateStr) {
        return errorResponse('Missing code or state', 400);
    }

    try {
        const { brandId } = JSON.parse(atob(stateStr));

        const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
            `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}&` +
            `client_secret=${env.FACEBOOK_CLIENT_SECRET}&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `code=${code}`);

        const tokenData = await tokenRes.json() as any;
        if (tokenData.error) throw new Error(tokenData.error.message);

        const accessToken = tokenData.access_token;

        const longTokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
            `grant_type=fb_exchange_token&` +
            `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}&` +
            `client_secret=${env.FACEBOOK_CLIENT_SECRET}&` +
            `fb_exchange_token=${accessToken}`);

        const longTokenData = await longTokenRes.json() as any;
        const finalToken = longTokenData.access_token;

        const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${finalToken}`);
        const pagesData = await pagesRes.json() as any;

        let igAccountId = '';
        let igName = '';

        for (const page of pagesData.data || []) {
            const igRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${finalToken}`);
            const igData = await igRes.json() as any;
            if (igData.instagram_business_account) {
                igAccountId = igData.instagram_business_account.id;
                const igProfileRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}?fields=username&access_token=${finalToken}`);
                const igProfileData = await igProfileRes.json() as any;
                igName = igProfileData.username;
                break;
            }
        }

        if (!igAccountId) {
            throw new Error('No Instagram Business account found linked to your Facebook Pages.');
        }

        const socialAccountId = crypto.randomUUID();
        const encryptedToken = await encryptToken(finalToken, env.TOKEN_ENCRYPTION_KEY);

        await env.DB.prepare(
            'INSERT INTO social_accounts (id, brand_id, platform, platform_account_id, username, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(socialAccountId, brandId, 'instagram', igAccountId, igName || 'Instagram Account', 'connected').run();

        await env.DB.prepare(
            'INSERT INTO oauth_tokens (id, social_account_id, platform, access_token_encrypted, expires_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), socialAccountId, 'instagram', encryptedToken, new Date(Date.now() + (longTokenData.expires_in || 5184000) * 1000).toISOString()).run();

        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?success=true`, 302);
    } catch (e: any) {
        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?error=${encodeURIComponent(e.message)}`, 302);
    }
};
