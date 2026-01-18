import { TimeBasedCache } from './cache';

describe('TimeBasedCache', () => {
  let cache: TimeBasedCache<string>;

  beforeEach(() => {
    cache = new TimeBasedCache<string>(1000); // 1 second TTL for testing
  });

  describe('Initialization', () => {
    it('should create with default TTL', () => {
      const defaultCache = new TimeBasedCache();
      expect(defaultCache).toBeTruthy();
    });

    it('should create with custom TTL', () => {
      const customCache = new TimeBasedCache(5000);
      expect(customCache).toBeTruthy();
    });

    it('should have size 0 initially', () => {
      expect(cache.size).toBe(0);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should update existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should handle multiple entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.size).toBe(3);
    });
  });

  describe('TTL and expiration', () => {
    it('should return null for expired entry', async () => {
      cache.set('key1', 'value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cache.get('key1')).toBeNull();
    });

    it('should remove expired entry from cache', async () => {
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      cache.get('key1'); // Triggers expiration check
      expect(cache.get('key1')).toBeNull();
    });

    it('should not expire entries within TTL', async () => {
      cache.set('key1', 'value1');
      
      // Wait half the TTL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired entry', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired entry', async () => {
      cache.set('key1', 'value1');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(cache.size).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
    });

    it('should include expired entries in size', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Size includes expired entries until they're accessed
      expect(cache.size).toBe(2);
    });
  });

  describe('generateKey', () => {
    it('should return __all__ for empty array', () => {
      expect(TimeBasedCache.generateKey([])).toBe('__all__');
    });

    it('should return sorted comma-separated string for single field', () => {
      expect(TimeBasedCache.generateKey(['project'])).toBe('project');
    });

    it('should return sorted comma-separated string for multiple fields', () => {
      expect(TimeBasedCache.generateKey(['project', 'employee'])).toBe('employee,project');
    });

    it('should sort fields alphabetically', () => {
      expect(TimeBasedCache.generateKey(['date', 'project', 'employee']))
        .toBe('date,employee,project');
    });

    it('should produce same key regardless of input order', () => {
      const key1 = TimeBasedCache.generateKey(['project', 'employee', 'date']);
      const key2 = TimeBasedCache.generateKey(['date', 'employee', 'project']);
      const key3 = TimeBasedCache.generateKey(['employee', 'project', 'date']);
      
      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });
  });

  describe('Complex data types', () => {
    it('should handle objects', () => {
      const objectCache = new TimeBasedCache<{ name: string; value: number }>();
      const data = { name: 'test', value: 42 };
      
      objectCache.set('key1', data);
      expect(objectCache.get('key1')).toEqual(data);
    });

    it('should handle arrays', () => {
      const arrayCache = new TimeBasedCache<number[]>();
      const data = [1, 2, 3, 4, 5];
      
      arrayCache.set('key1', data);
      expect(arrayCache.get('key1')).toEqual(data);
    });

    it('should handle nested structures', () => {
      interface ComplexData {
        users: Array<{ id: number; name: string }>;
        metadata: { count: number };
      }
      
      const complexCache = new TimeBasedCache<ComplexData>();
      const data: ComplexData = {
        users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
        metadata: { count: 2 }
      };
      
      complexCache.set('key1', data);
      expect(complexCache.get('key1')).toEqual(data);
    });
  });
});
