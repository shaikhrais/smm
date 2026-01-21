import { Env } from '../../utils';
import { decryptToken, encryptToken } from '../../crypto';

export async function ensureValidToken(env: Env, account: any): Promise<string> {
    const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
    const now = new Date();

    // If token expires in less than 5 minutes, refresh it
    if (expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        return refreshPlatformToken(env, account);
    }

    return decryptToken(account.access_token_encrypted, env.TOKEN_ENCRYPTION_KEY);
}

async function refreshPlatformToken(env: Env, account: any): Promise<string> {
    const platform = account.platform;
    const refreshToken = account.refresh_token_encrypted
        ? await decryptToken(account.refresh_token_encrypted, env.TOKEN_ENCRYPTION_KEY)
        : null;

    if (!refreshToken && platform !== 'facebook') {
        throw new Error(`No refresh token available for ${platform}`);
    }

    let newTokenData: { access_token: string; refresh_token?: string; expires_in: number };

    switch (platform) {
        case 'twitter':
            newTokenData = await refreshTwitterToken(env, refreshToken!);
            break;
        case 'linkedin':
            newTokenData = await refreshLinkedInToken(env, refreshToken!);
            break;
        case 'facebook':
            // Facebook long-lived tokens just need to be re-exchanged if needed
            // but usually they last 60 days. For now, we return current or throw
            throw new Error('Facebook manual refresh not implemented (Long-lived tokens last 60 days)');
        default:
            throw new Error(`Refresh not supported for ${platform}`);
    }

    // Update database with new tokens
    const encryptedAccessToken = await encryptToken(newTokenData.access_token, env.TOKEN_ENCRYPTION_KEY);
    const encryptedRefreshToken = newTokenData.refresh_token
        ? await encryptToken(newTokenData.refresh_token, env.TOKEN_ENCRYPTION_KEY)
        : account.refresh_token_encrypted;

    await env.DB.prepare(
        'UPDATE oauth_tokens SET access_token_encrypted = ?, refresh_token_encrypted = ?, expires_at = ?, updated_at = ? WHERE social_account_id = ?'
    ).bind(
        encryptedAccessToken,
        encryptedRefreshToken,
        new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
        new Date().toISOString(),
        account.social_account_id
    ).run();

    return newTokenData.access_token;
}

async function refreshTwitterToken(env: Env, refreshToken: string) {
    const basicAuth = btoa(`${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`);
    const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    const data = await res.json() as any;
    if (data.error) throw new Error(`Twitter refresh failed: ${data.error_description || data.error}`);
    return data;
}

async function refreshLinkedInToken(env: Env, refreshToken: string) {
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: env.LINKEDIN_CLIENT_ID,
            client_secret: env.LINKEDIN_CLIENT_SECRET
        })
    });

    const data = await res.json() as any;
    if (data.error) throw new Error(`LinkedIn refresh failed: ${data.error_description || data.error}`);
    return data;
}
