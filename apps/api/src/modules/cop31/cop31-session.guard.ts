import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

export type Cop31SessionUser = { id: string; email: string };

@Injectable()
export class Cop31SessionGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: Cop31SessionUser }>();
    const secret = this.config.get<string>('COP31_EVENTS_SESSION_SECRET');
    const match = /^Bearer ([A-Za-z0-9_.-]{1,2048})$/.exec(request.headers.authorization ?? '');
    if (!secret || secret.length < 32 || !match) throw new UnauthorizedException('Oturum gerekli.');
    const [encoded, signature, extra] = match[1].split('.');
    if (!encoded || !signature || extra) throw new UnauthorizedException('Oturum geçersiz.');
    const expected = createHmac('sha256', secret).update(encoded).digest();
    let actual: Buffer;
    try { actual = Buffer.from(signature, 'base64url'); } catch { throw new UnauthorizedException('Oturum geçersiz.'); }
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException('Oturum geçersiz.');
    try {
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { sub?: unknown; email?: unknown; exp?: unknown };
      if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.email !== 'string' || !Number.isInteger(payload.exp) || Number(payload.exp) <= Math.floor(Date.now() / 1000)) throw new Error();
      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch { throw new UnauthorizedException('Oturum geçersiz veya süresi dolmuş.'); }
  }
}
