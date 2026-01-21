import { jsonResponse, errorResponse, Env } from '../../../utils';

const TWITTER_CLIENT_ID = 'YOUR_TWITTER_ID';
const REDIRECT_URI = 'https://social-media-manager-api.pages.dev/api/oauth/twitter/callback';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
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
        `&code_challenge=challenge&code_challenge_method=plain`;

    return Response.redirect(twitterAuthUrl, 302);
};
