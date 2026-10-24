import { NextRequest } from 'next/server';
import { proxySavedEvents } from '@/lib/cop31-saved-api';

export function GET(request: NextRequest) { return proxySavedEvents(request, '', 'GET'); }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.slug !== 'string') return Response.json({ error: 'Etkinlik kısa adı gerekli.' }, { status: 400 });
  return proxySavedEvents(request, '', 'POST', { slug: body.slug });
}
