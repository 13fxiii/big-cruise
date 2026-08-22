import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

function base64Url(value: Buffer) {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export async function GET() {
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'X OAuth is not configured. Set X_CLIENT_ID and X_REDIRECT_URI on the server.' },
      { status: 503 }
    );
  }

  const state = randomUUID();
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'users.read tweet.read offline.access');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('bch_x_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 10, path: '/' });
  response.cookies.set('bch_x_pkce_verifier', verifier, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 10, path: '/' });

  return response;
}
