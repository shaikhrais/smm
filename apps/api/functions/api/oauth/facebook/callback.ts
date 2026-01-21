import { jsonResponse, errorResponse, Env } from '../../../utils';
import { encryptToken } from '../../../crypto';

const FB_CLIENT_ID = 'YOUR_FB_CLIENT_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/facebook/callback';

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
            `client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&client_secret=${env.FACEBOOK_CLIENT_SECRET}` +
            `&code=${code}`);

        const tokenData = await tokenRes.json() as any;
        if (tokenData.error) throw new Error(tokenData.error.message);

        const accessToken = tokenData.access_token;

        const longLivedRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
            `grant_type=fb_exchange_token` +
            `&client_id=${env.FACEBOOK_CLIENT_ID || FB_CLIENT_ID}` +
            `&client_secret=${env.FACEBOOK_CLIENT_SECRET}` +
            `&fb_exchange_token=${accessToken}`);

        const longLivedData = await longLivedRes.json() as any;
        const finalToken = longLivedData.access_token || accessToken;

        const meRes = await fetch(`https://graph.facebook.com/me?access_token=${finalToken}`);
        const meData = await meRes.json() as any;

        const socialAccountId = crypto.randomUUID();
        const encryptedToken = await encryptToken(finalToken, env.TOKEN_ENCRYPTION_KEY);

        await env.DB.batch([
            env.DB.prepare('INSERT INTO social_accounts (id, brand_id, platform, username, handle, status) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(socialAccountId, brandId, 'facebook', meData.name, `@${meData.id}`, 'connected'),
            env.DB.prepare('INSERT INTO oauth_tokens (id, social_account_id, platform, access_token_encrypted, expires_at) VALUES (?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), socialAccountId, 'facebook', encryptedToken, longLivedData.expires_in ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString() : null)
        ]);

        return Response.redirect('https://social-media-manager-ui.pages.dev/social-media?success=true', 302);
    } catch (e: any) {
        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?error=${encodeURIComponent(e.message)}`, 302);
    }
};
