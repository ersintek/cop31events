import { NextRequest, NextResponse } from 'next/server';
import { COP31_SESSION_COOKIE, cop31AppOrigin, createSsoState, readCop31Session, safeReturnTo } from '@/lib/cop31-session';

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const appOrigin = cop31AppOrigin(request.nextUrl.origin);
  const existing = readCop31Session(request.cookies.get(COP31_SESSION_COOKIE)?.value);
  if (existing) return NextResponse.redirect(new URL(returnTo, appOrigin));

  const depoOrigin = (process.env.DEPO_SSO_ORIGIN || 'https://cop31radar.com').replace(/\/$/, '');
  const callback = new URL('/api/session/sso/callback', appOrigin).toString();
  const state = createSsoState();
  const authorize = new URL('/api/depo/sso/authorize', depoOrigin);
  authorize.searchParams.set('redirect_uri', callback);
  authorize.searchParams.set('state', state);
  const response = NextResponse.redirect(authorize);
  response.cookies.set('cop31_sso_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 10 * 60 });
  response.cookies.set('cop31_sso_return', returnTo, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 10 * 60 });
  return response;
}

