interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<V> {
  private readonly entries = new Map<string, CacheEntry<V>>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async get(key: string, compute: () => Promise<V>): Promise<V> {
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > this.now()) {
      return existing.value;
    }

    const value = await compute();
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    return value;
  }
}
