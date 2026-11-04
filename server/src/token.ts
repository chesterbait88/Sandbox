import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface SessionPayload {
  theme: string;
  seed: string;
  startedAt: number;
  nonce: string;
}

const b64u = (b: Buffer): string => b.toString('base64url');

/** HMAC-signed session tokens: base64url(json).base64url(hmac). */
export class TokenSigner {
  constructor(private secret: string) {}

  sign(payload: SessionPayload): string {
    const body = b64u(Buffer.from(JSON.stringify(payload)));
    return `${body}.${this.mac(body)}`;
  }

  verify(token: string): SessionPayload | null {
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return null;
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = this.mac(body);
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
      const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
      if (typeof p.theme !== 'string' || typeof p.seed !== 'string' || typeof p.startedAt !== 'number' || typeof p.nonce !== 'string') return null;
      return p;
    } catch {
      return null;
    }
  }

  private mac(body: string): string {
    return b64u(createHmac('sha256', this.secret).update(body).digest());
  }

  static nonce(): string {
    return b64u(randomBytes(12));
  }
}

/** The signing secret: SCORE_SECRET, or a random one per process (tokens will not survive a restart). */
export function resolveSecret(env: NodeJS.ProcessEnv, log: (msg: string) => void = console.warn): string {
  if (env.SCORE_SECRET && env.SCORE_SECRET.length >= 8) return env.SCORE_SECRET;
  log('SCORE_SECRET is not set (or too short); using a random secret for this process. Set SCORE_SECRET in production.');
  return b64u(randomBytes(32));
}
