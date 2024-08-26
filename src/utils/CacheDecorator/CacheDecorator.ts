// src/utils/CacheDecorator.ts
import { inject, injectable } from 'inversify';

import { TYPES } from '../../utils/types.js';

import type { ICacheService } from '../../interfaces/index.js';

const CACHEABLE_METADATA_KEY = Symbol('cacheable');

export function Cacheable(cacheKey: string, duration: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    // Add metadata to the class
    const existingMetadata =
      Reflect.getMetadata(CACHEABLE_METADATA_KEY, target.constructor) || {};
    existingMetadata[propertyKey] = { cacheKey, duration };
    Reflect.defineMetadata(
      CACHEABLE_METADATA_KEY,
      existingMetadata,
      target.constructor,
    );

    descriptor.value = async function (...args: any[]) {
      const cacheService = (this as any).cacheService as ICacheService;

      if (!cacheService) {
        console.warn(
          `CacheService not found for ${className}.${propertyKey}. Cacheable decorator may not work as expected.`,
        );
        return originalMethod.apply(this, args);
      }

      const fullCacheKey = `${className}:${propertyKey}:${cacheKey}-${JSON.stringify(
        args,
      )}`;
      const cachedResult = await cacheService.get(fullCacheKey);

      if (cachedResult !== undefined && cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      await cacheService.set(fullCacheKey, result, duration);

      return result;
    };

    return descriptor;
  };
}

@injectable()
export class CacheableClass {
  constructor(
    @inject(TYPES.CacheService) protected cacheService: ICacheService,
  ) {}

  static getCacheableMetadata(): Record<
    string,
    { cacheKey: string; duration: number }
  > {
    return Reflect.getMetadata(CACHEABLE_METADATA_KEY, this) || {};
  }
}
