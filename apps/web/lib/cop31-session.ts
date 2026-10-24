import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const COP31_SESSION_COOKIE = 'cop31_events_session';
const SESSION_SECONDS = 30 * 24 * 60 * 60;

type SessionPayload = { sub: string; email: string; exp: number };

function sessionSecret() {
  const secret = process.env.COP31_EVENTS_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('COP31_EVENTS_SESSION_SECRET must contain at least 32 characters.');
  return secret;
}

export function createCop31Session(user: { id: string; email: string }) {
  const payload: SessionPayload = { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(encoded).digest('base64url');
  return { value: `${encoded}.${signature}`, maxAge: SESSION_SECONDS };
}

export function readCop31Session(value: string | undefined): SessionPayload | null {
  if (!value || value.length > 2048) return null;
  const [encoded, signature, extra] = value.split('.');
  if (!encoded || !signature || extra) return null;
  const expected = createHmac('sha256', sessionSecret()).update(encoded).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

export function createSsoState() { return randomBytes(32).toString('base64url'); }

export function validSsoState(expected: string | undefined, received: string | null) {
  if (!expected || !received) return false;
  const a = Buffer.from(expected), b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function safeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/cop31';
  try { const parsed = new URL(value, 'https://events.cop31radar.com'); return parsed.origin === 'https://events.cop31radar.com' || parsed.origin === 'http://localhost:3001' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/cop31'; }
  catch { return '/cop31'; }
}
