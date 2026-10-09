import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { ClockPort } from '../../application/ports/out/ClockPort';
import type { SessionCachePort } from '../../application/ports/out/SessionCachePort';
import type { AuthenticatedUser } from '../../domain/AuthSession';
import { AUTH_TOKENS } from '../../tokens';

/** How long a permission removed in Saba can still be honored here. */
export const SESSION_CACHE_TTL_MS = 30_000;
/** Bounds memory if many tokens pass by; the oldest entry goes first. */
const MAX_ENTRIES = 1_000;

interface Entry {
  user: AuthenticatedUser;
  expiresAt: number;
}

/**
 * Per process: with several API replicas each one asks Saba on its own, which
 * only costs one extra request per replica and TTL. The key is the token's
 * hash, so a heap dump does not hand out live sessions.
 */
@Injectable()
export class InMemorySessionCache implements SessionCachePort {
  private readonly entries = new Map<string, Entry>();

  constructor(@Inject(AUTH_TOKENS.Clock) private readonly clock: ClockPort) {}

  get(accessToken: string): AuthenticatedUser | null {
    const key = keyOf(accessToken);
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.clock.now().getTime()) {
      this.entries.delete(key);
      return null;
    }
    return entry.user;
  }

  set(accessToken: string, user: AuthenticatedUser): void {
    const key = keyOf(accessToken);
    this.entries.delete(key);
    if (this.entries.size >= MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, {
      user,
      expiresAt: this.clock.now().getTime() + SESSION_CACHE_TTL_MS,
    });
  }

  delete(accessToken: string): void {
    this.entries.delete(keyOf(accessToken));
  }
}

function keyOf(accessToken: string): string {
  return createHash('sha256').update(accessToken).digest('hex');
}
