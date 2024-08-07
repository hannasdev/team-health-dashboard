// src/utils/CacheDecorator.ts
import { inject, injectable } from 'inversify';

import type { ICacheService } from '@/interfaces';
import { TYPES } from '@/utils/types';

export function Cacheable(cacheKey: string, duration: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = (this as any).cacheService as ICacheService;

      if (!cacheService) {
        console.warn(
          'CacheService not found. Cacheable decorator may not work as expected.',
        );
        return originalMethod.apply(this, args);
      }

      const key = `${cacheKey}-${JSON.stringify(args)}`;
      const cachedResult = cacheService.get(key);

      if (cachedResult) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      cacheService.set(key, result, duration);

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
}
