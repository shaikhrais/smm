import { jsonResponse, errorResponse, Env } from '../../../utils';
import { encryptToken } from '../../../crypto';
// @ts-ignore
import { TwitterApi } from 'twitter-api-v2';

const TWITTER_CLIENT_ID = 'YOUR_TWITTER_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/twitter/callback';

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request } = context;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[pathParts.length - 1];

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

    // Twitter OAuth 2.0 uses PKCE
    const codeVerifier = btoa(crypto.getRandomValues(new Uint8Array(32)).toString()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 128);
    const state = btoa(JSON.stringify({ brandId, codeVerifier }));

    const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?` +
        `response_type=code` +
        `&client_id=${env.TWITTER_CLIENT_ID || TWITTER_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=tweet.read%20tweet.write%20users.read%20offline.access` +
        `&state=${state}` +
        `&code_challenge=challenge&code_challenge_method=plain`; // Simplified PKCE for now

    return Response.redirect(twitterAuthUrl, 302);
}

async function handleCallback({ request, env }: { request: Request, env: Env }) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');

    if (!code || !stateStr) {
        return errorResponse('Missing code or state', 400);
    }

    try {
        const { brandId, codeVerifier } = JSON.parse(atob(stateStr));

        // Exchange code for token
        const basicAuth = btoa(`${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`);
        const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
            },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier
            })
        });

        const tokenData = await tokenRes.json() as any;
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        // Get User Info
        const userRes = await fetch('https://api.twitter.com/2/users/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const userData = await userRes.json() as any;

        // Store
        const socialAccountId = crypto.randomUUID();
        const encryptedAccessToken = await encryptToken(tokenData.access_token, env.TOKEN_ENCRYPTION_KEY);
        const encryptedRefreshToken = tokenData.refresh_token ? await encryptToken(tokenData.refresh_token, env.TOKEN_ENCRYPTION_KEY) : null;

        await env.DB.batch([
            env.DB.prepare('INSERT INTO social_accounts (id, brand_id, platform, username, handle, status) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(socialAccountId, brandId, 'twitter', userData.data.name, `@${userData.data.username}`, 'connected'),
            env.DB.prepare('INSERT INTO oauth_tokens (id, social_account_id, platform, access_token_encrypted, refresh_token_encrypted, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), socialAccountId, 'twitter', encryptedAccessToken, encryptedRefreshToken, new Date(Date.now() + tokenData.expires_in * 1000).toISOString())
        ]);

        return Response.redirect('https://social-media-manager-ui.pages.dev/social-media?success=true', 302);
    } catch (e: any) {
        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?error=${encodeURIComponent(e.message)}`, 302);
    }
}
