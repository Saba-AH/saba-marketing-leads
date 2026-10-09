import { describe, expect, it } from 'vitest';
import {
  InMemorySessionCache,
  SESSION_CACHE_TTL_MS,
} from '../../modules/auth/infrastructure/cache/InMemorySessionCache';
import { agent } from '../support/fakeSabaAuth';

function cacheAt(clock: { now: Date }): InMemorySessionCache {
  return new InMemorySessionCache({ now: () => clock.now });
}

describe('InMemorySessionCache', () => {
  it('serves the user until the TTL runs out', () => {
    const clock = { now: new Date('2026-10-08T12:00:00Z') };
    const cache = cacheAt(clock);
    cache.set('token', agent());

    clock.now = new Date(clock.now.getTime() + SESSION_CACHE_TTL_MS - 1);
    expect(cache.get('token')).toEqual(agent());

    clock.now = new Date(clock.now.getTime() + 1);
    expect(cache.get('token')).toBeNull();
  });

  it('keeps sessions apart and forgets one on delete', () => {
    const cache = cacheAt({ now: new Date() });
    cache.set('a', agent({ id: 'a' }));
    cache.set('b', agent({ id: 'b' }));

    cache.delete('a');

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')?.id).toBe('b');
  });
});
