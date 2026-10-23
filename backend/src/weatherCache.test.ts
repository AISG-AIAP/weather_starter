import { describe, expect, it } from 'vitest';
import { TtlCache } from './weatherCache.js';

describe('TtlCache', () => {
  it('returns the cached value without recomputing within the TTL window', async () => {
    let calls = 0;
    let now = 1000;
    const cache = new TtlCache<string>(5000, () => now);

    const first = await cache.get('tanglin', async () => {
      calls++;
      return `value-${calls}`;
    });
    now += 2000;
    const second = await cache.get('tanglin', async () => {
      calls++;
      return `value-${calls}`;
    });

    expect(first).toBe('value-1');
    expect(second).toBe('value-1');
    expect(calls).toBe(1);
  });

  it('recomputes once the TTL window has elapsed', async () => {
    let calls = 0;
    let now = 1000;
    const cache = new TtlCache<string>(5000, () => now);

    await cache.get('tanglin', async () => {
      calls++;
      return `value-${calls}`;
    });
    now += 5001;
    const afterExpiry = await cache.get('tanglin', async () => {
      calls++;
      return `value-${calls}`;
    });

    expect(afterExpiry).toBe('value-2');
    expect(calls).toBe(2);
  });

  it('computes separately for different keys', async () => {
    let calls = 0;
    const cache = new TtlCache<string>(5000, () => 1000);

    const a = await cache.get('tanglin', async () => {
      calls++;
      return `value-${calls}`;
    });
    const b = await cache.get('bishan', async () => {
      calls++;
      return `value-${calls}`;
    });

    expect(a).toBe('value-1');
    expect(b).toBe('value-2');
    expect(calls).toBe(2);
  });
});
