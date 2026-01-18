interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
export class TimeBasedCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttl: number = 5 * 60 * 1000) { }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
  get size(): number {
    return this.cache.size;
  }

  static generateKey(fields: string[]): string {
    return fields.length === 0 ? '__all__' : [...fields].sort().join(',');
  }
}