// src/services/CacheService.ts
import { injectable } from 'inversify';
import { ICacheService } from '../interfaces/ICacheService';

@injectable()
export class CacheService implements ICacheService {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  set<T>(key: string, value: T, ttl: number = 3600000): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
