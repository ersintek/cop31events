import { NextRequest, NextResponse } from 'next/server';
import { COP31_SESSION_COOKIE, readCop31Session } from '@/lib/cop31-session';

export async function proxySavedEvents(request: NextRequest, path: string, method: 'GET' | 'POST' | 'DELETE', body?: unknown) {
  let session = null;
  try { session = readCop31Session(request.cookies.get(COP31_SESSION_COOKIE)?.value); }
  catch { return NextResponse.json({ error: 'Oturum yapılandırılmamış.' }, { status: 503 }); }
  if (!session) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  const base = process.env.API_INTERNAL_URL;
  if (!base) return NextResponse.json({ error: 'Etkinlik servisi yapılandırılmamış.' }, { status: 503 });
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/cop31/saved${path}`, {
      method,
      headers: { authorization: `Bearer ${request.cookies.get(COP31_SESSION_COOKIE)?.value}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store',
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    const payload = await response.json().catch(() => ({ error: 'Etkinlik servisi yanıt vermedi.' }));
    return NextResponse.json(payload, { status: response.status, headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Etkinlik servisine ulaşılamadı.' }, { status: 503 });
  }
}
