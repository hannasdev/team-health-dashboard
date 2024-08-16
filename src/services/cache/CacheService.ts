// src/services/cache/CacheService.ts
import { injectable } from 'inversify';

import type { ICacheService } from '../../interfaces/index.js';

@injectable()
export class CacheService implements ICacheService {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly maxSize: number = 1000; // Example size limit

  constructor() {
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      // Remove the oldest item if we're at capacity
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    const expiry = ttl ? Date.now() + ttl * 1000 : Infinity;
    this.cache.set(key, { value, expiry });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}
