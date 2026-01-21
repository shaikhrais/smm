import { jsonResponse, errorResponse, Env } from '../../../utils';
import { encryptToken } from '../../../crypto';

const LINKEDIN_CLIENT_ID = 'YOUR_LINKEDIN_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/linkedin/callback';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');

    if (!code || !stateStr) {
        return errorResponse('Missing code or state', 400);
    }

    try {
        const { brandId } = JSON.parse(atob(stateStr));

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

        const profileRes = await fetch('https://api.linkedin.com/v2/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const profileData = await profileRes.json() as any;

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
        return Response.redirect(`https://social-media-manager-ui.pages.dev/social-media?error=${encodeURIComponent(e.message)}`, 302);
    }
};
