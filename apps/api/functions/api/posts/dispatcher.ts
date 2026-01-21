import { Env } from '../../utils';
import { decryptToken } from '../../crypto';
import { ensureValidToken } from '../oauth/refresh-logic';
// @ts-ignore
import { TwitterApi } from 'twitter-api-v2';
// @ts-ignore
import FB from 'fb';

export interface PostResult {
    platform: string;
    success: boolean;
    postId?: string;
    error?: string;
}

export async function dispatchPost(
    env: Env,
    brandId: string,
    content: string,
    platforms: string[],
    mediaUrls: string[] = []
): Promise<PostResult[]> {
    const results: PostResult[] = [];

    // 1. Fetch all connected social accounts for this brand
    const { results: accounts } = await env.DB.prepare(
        'SELECT sa.*, ot.access_token_encrypted, ot.refresh_token_encrypted, ot.expires_at FROM social_accounts sa ' +
        'JOIN oauth_tokens ot ON sa.id = ot.social_account_id ' +
        'WHERE sa.brand_id = ? AND sa.status = "connected"'
    ).bind(brandId).all();

    if (!accounts || accounts.length === 0) {
        return [{ platform: 'system', success: false, error: 'No connected social accounts found for this brand.' }];
    }

    // 2. Filter accounts by requested platforms
    const targetAccounts = (accounts as any[]).filter(acc => platforms.includes(acc.platform));

    if (targetAccounts.length === 0) {
        return [{ platform: 'system', success: false, error: 'None of the requested platforms are connected.' }];
    }

    // 3. Post to each platform
    for (const account of targetAccounts) {
        try {
            // Ensure token is valid (refresh if needed)
            const accessToken = await ensureValidToken(env, account);

            let result: PostResult;
            switch (account.platform) {
                case 'twitter':
                    result = await postToTwitter(accessToken, content, mediaUrls);
                    break;
                case 'facebook':
                    result = await postToFacebook(accessToken, content, mediaUrls);
                    break;
                case 'linkedin':
                    result = await postToLinkedIn(accessToken, content, mediaUrls);
                    break;
                default:
                    result = { platform: account.platform, success: false, error: 'Platform not supported yet.' };
            }
            results.push(result);
        } catch (e: any) {
            results.push({ platform: account.platform, success: false, error: `Auth/Refresh Error: ${e.message}` });
        }
    }

    return results;
}

async function postToTwitter(token: string, content: string, mediaUrls: string[]): Promise<PostResult> {
    try {
        const client = new TwitterApi(token);
        // Simple text tweet for now
        const tweet = await client.v2.tweet(content);
        return { platform: 'twitter', success: true, postId: tweet.data.id };
    } catch (e: any) {
        return { platform: 'twitter', success: false, error: e.message };
    }
}

async function postToFacebook(token: string, content: string, mediaUrls: string[]): Promise<PostResult> {
    try {
        // Using fetch for Facebook as it's more direct in Workers
        const res = await fetch(`https://graph.facebook.com/me/feed`, {
            method: 'POST',
            body: new URLSearchParams({
                message: content,
                access_token: token
            })
        });
        const data = await res.json() as any;
        if (data.error) throw new Error(data.error.message);
        return { platform: 'facebook', success: true, postId: data.id };
    } catch (e: any) {
        return { platform: 'facebook', success: false, error: e.message };
    }
}

async function postToLinkedIn(token: string, content: string, mediaUrls: string[]): Promise<PostResult> {
    try {
        // LinkedIn URN mapping would be needed in a real app, assuming 'me' works for now
        // This is a simplified version
        const meRes = await fetch('https://api.linkedin.com/v2/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meRes.json() as any;
        const authorUrn = `urn:li:person:${meData.id}`;

        const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                author: authorUrn,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: { text: content },
                        shareMediaCategory: 'NONE'
                    }
                },
                visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
            })
        });

        if (!postRes.ok) {
            const errData = await postRes.json() as any;
            throw new Error(errData.message || 'LinkedIn Post Failed');
        }

        const data = await postRes.json() as any;
        return { platform: 'linkedin', success: true, postId: data.id };
    } catch (e: any) {
        return { platform: 'linkedin', success: false, error: e.message };
    }
}
