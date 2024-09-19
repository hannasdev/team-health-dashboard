import type { ICacheService } from '../../interfaces/index.js';

export function createMockCacheService(): jest.Mocked<ICacheService> {
  const cache = new Map<string, { value: any; expiry: number }>();

  return {
    get: jest.fn(async (key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      if (item.expiry < Date.now()) {
        cache.delete(key);
        return null;
      }
      return item.value;
    }),
    set: jest.fn(async (key: string, value: any, ttl?: number) => {
      const expiry = ttl ? Date.now() + ttl * 1000 : Infinity;
      cache.set(key, { value, expiry });
    }),
    delete: jest.fn((key: string) => {
      cache.delete(key);
    }),
    clear: jest.fn(() => {
      cache.clear();
    }),
  };
}
