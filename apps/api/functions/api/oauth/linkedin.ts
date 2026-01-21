import { jsonResponse, errorResponse, Env } from '../../utils';
import { encryptToken } from '../../crypto';
// @ts-ignore - linkedin-api-client might not have types
import { LinkedIn } from 'linkedin-api-client';

const LINKEDIN_CLIENT_ID = 'YOUR_LINKEDIN_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/linkedin/callback';

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

    const state = btoa(JSON.stringify({ brandId }));

    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code` +
        `&client_id=${env.LINKEDIN_CLIENT_ID || LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${state}` +
        `&scope=w_member_social%20r_liteprofile`;

    return Response.redirect(linkedinAuthUrl, 302);
}

async function handleCallback({ request, env }: { request: Request, env: Env }) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');

    if (!code || !stateStr) {
        return errorResponse('Missing code or state', 400);
    }

    try {
        const { brandId } = JSON.parse(atob(stateStr));

        // Exchange code for token
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: env.LINKEDIN_CLIENT_ID || LINKEDIN_CLIENT_ID,
                client_secret: env.LINKEDIN_CLIENT_SECRET
            })
        });

        const tokenData = await tokenRes.json() as any;
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        // Get Profile Info
        const profileRes = await fetch('https://api.linkedin.com/v2/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const profileData = await profileRes.json() as any;

        // Store
        const socialAccountId = crypto.randomUUID();
        const encryptedToken = await encryptToken(tokenData.access_token, env.TOKEN_ENCRYPTION_KEY);

        await env.DB.batch([
            env.DB.prepare('INSERT INTO social_accounts (id, brand_id, platform, username, handle, status) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(socialAccountId, brandId, 'linkedin', `${profileData.localizedFirstName} ${profileData.localizedLastName}`, `@${profileData.id}`, 'connected'),
            env.DB.prepare('INSERT INTO oauth_tokens (id, social_account_id, platform, access_token_encrypted, expires_at) VALUES (?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), socialAccountId, 'linkedin', encryptedToken, new Date(Date.now() + tokenData.expires_in * 1000).toISOString())
        ]);

        return Response.redirect('https://social-media-manager-ui.pages.dev/social-media?success=true', 302);
    } catch (e: any) {
        return errorResponse(`LinkedIn OAuth Error: ${e.message}`);
    }
}
