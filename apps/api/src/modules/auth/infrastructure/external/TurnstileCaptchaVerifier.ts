import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { CaptchaVerifierPort } from '../../application/ports/out/CaptchaVerifierPort';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthConfig } from '../authConfig';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 10_000;

const siteverifySchema = z.object({ success: z.boolean() });

@Injectable()
export class TurnstileCaptchaVerifier implements CaptchaVerifierPort {
  constructor(
    @Inject(AUTH_TOKENS.Config) private readonly config: AuthConfig
  ) {}

  async verify(token: string, ip: string | null): Promise<boolean> {
    const body = new URLSearchParams({
      secret: this.config.turnstileSecretKey,
      response: token,
    });
    if (ip) body.set('remoteip', ip);

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Turnstile siteverify respondió ${response.status}`);
    }
    return siteverifySchema.parse(await response.json()).success;
  }
}
