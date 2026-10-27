export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const upstream = await fetch('https://cop31radar.com/api/newsletter/subscribe', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    });
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Newsletter service unavailable' }, { status: 502 });
  }
}
