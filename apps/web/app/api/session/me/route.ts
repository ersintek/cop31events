import { NextRequest, NextResponse } from 'next/server';
import { COP31_SESSION_COOKIE, readCop31Session } from '@/lib/cop31-session';

export async function GET(request: NextRequest) {
  const session = readCop31Session(request.cookies.get(COP31_SESSION_COOKIE)?.value);
  return NextResponse.json({ user: session ? { id: session.sub, email: session.email } : null }, { headers: { 'cache-control': 'no-store' } });
}
