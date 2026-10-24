import { NextRequest, NextResponse } from 'next/server';
import { COP31_SESSION_COOKIE, cop31AppOrigin, createCop31Session, safeReturnTo, validSsoState } from '@/lib/cop31-session';

export async function GET(request: NextRequest) {
  const appOrigin = 'https://events.cop31radar.com';
  if (request.nextUrl.searchParams.get('logout') === '1') {
    const response = NextResponse.redirect(new URL('/cop31', appOrigin));
    for (const name of [COP31_SESSION_COOKIE, 'cop31_sso_state', 'cop31_sso_return']) response.cookies.set(name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    return response;
  }
  const code = request.nextUrl.searchParams.get('code') || '';
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('cop31_sso_state')?.value;
  const returnTo = safeReturnTo(request.cookies.get('cop31_sso_return')?.value);
  if (!validSsoState(expectedState, state) || code.length < 32 || code.length > 128) {
    return NextResponse.redirect(new URL('/cop31?login=failed', appOrigin));
  }

  const secret = process.env.DEPO_SSO_CLIENT_SECRET;
  if (!secret) return NextResponse.json({ message: 'Depo giriş bağlantısı yapılandırılmadı.' }, { status: 503 });
  const depoOrigin = (process.env.DEPO_SSO_ORIGIN || 'https://cop31radar.com').replace(/\/$/, '');
  const callback = new URL('/api/session/sso/callback', appOrigin).toString();
  const exchange = await fetch(`${depoOrigin}/api/depo/sso/exchange`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-events-sso-secret': secret },
    body: JSON.stringify({ code, redirect_uri: callback }),
    cache: 'no-store',
  }).catch(() => null);
  if (!exchange?.ok) return NextResponse.redirect(new URL('/cop31?login=failed', appOrigin));
  const data = await exchange.json().catch(() => null) as { user?: { id?: string; email?: string } } | null;
  if (!data?.user?.id || !data.user.email) return NextResponse.redirect(new URL('/cop31?login=failed', appOrigin));

  const session = createCop31Session({ id: data.user.id, email: data.user.email });
  const response = NextResponse.redirect(new URL(returnTo, appOrigin));
  response.cookies.set(COP31_SESSION_COOKIE, session.value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: session.maxAge });
  response.cookies.set('cop31_sso_state', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  response.cookies.set('cop31_sso_return', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}

