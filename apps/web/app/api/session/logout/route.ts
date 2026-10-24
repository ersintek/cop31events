import { NextRequest, NextResponse } from 'next/server';
import { cop31AppOrigin } from '@/lib/cop31-session';

export async function GET(request: NextRequest) {
  const depoOrigin = (process.env.DEPO_SSO_ORIGIN || 'https://cop31radar.com').replace(/\/$/, '');
  const appOrigin = cop31AppOrigin(request.nextUrl.origin);
  const callback = new URL('/api/session/sso/callback', appOrigin).toString();
  const logout = new URL('/api/depo/sso/logout', depoOrigin);
  logout.searchParams.set('redirect_uri', callback);
  return NextResponse.redirect(logout);
}

