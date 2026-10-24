import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const depoOrigin = (process.env.DEPO_SSO_ORIGIN || 'https://cop31radar.com').replace(/\/$/, '');
  const appOrigin = process.env.PUBLIC_APP_URL ? new URL(process.env.PUBLIC_APP_URL).origin : request.nextUrl.origin;
  const callback = new URL('/api/session/sso/callback', appOrigin).toString();
  const logout = new URL('/api/depo/sso/logout', depoOrigin);
  logout.searchParams.set('redirect_uri', callback);
  return NextResponse.redirect(logout);
}
