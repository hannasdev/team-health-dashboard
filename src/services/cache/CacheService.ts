// src/services/cache/CacheService.ts
import { injectable } from 'inversify';
import type { ICacheService } from '@/interfaces/ICacheService';

@injectable()
export class CacheService implements ICacheService {
  private cache: Map<string, any> = new Map();

  get<T>(key: string): T | null {
    return this.cache.get(key) || null;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl * 1000);
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
