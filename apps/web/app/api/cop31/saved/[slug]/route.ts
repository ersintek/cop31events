import { NextRequest } from 'next/server';
import { proxySavedEvents } from '@/lib/cop31-saved-api';

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return proxySavedEvents(request, `/${encodeURIComponent(slug)}`, 'DELETE');
}
