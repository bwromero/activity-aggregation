/**
 * Generic cache entry with metadata
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
  }
  
  /**
   * Time-based cache utility using Map
   * @description Generic, reusable cache with automatic expiration
   */
  export class TimeBasedCache<T> {
    private readonly cache = new Map<string, CacheEntry<T>>();
  
    constructor(private readonly ttl: number = 5 * 60 * 1000) {}
  
    /**
     * Get data from cache if valid
     */
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
  
    /**
     * Store data in cache with current timestamp
     */
    set(key: string, data: T): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  
    /**
     * Check if cache entry has expired
     */
    private isExpired(entry: CacheEntry<T>): boolean {
      return Date.now() - entry.timestamp > this.ttl;
    }
  
    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
      return this.get(key) !== null;
    }
  
    /**
     * Get cache size
     */
    get size(): number {
      return this.cache.size;
    }
  }