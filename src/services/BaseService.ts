// BaseService.ts
// Abstract Class
import { injectable, inject } from 'inversify';
import type { ICacheService } from '@/interfaces/index';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

@injectable()
export abstract class BaseService {
  constructor(
    @inject(TYPES.Logger) protected logger: Logger,
    @inject(TYPES.CacheService) protected cacheService: ICacheService,
  ) {}

  protected abstract getCacheKey(params: any): string;

  protected async getDataWithCache<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    expirationTime: number = 3600, // 1 hour default
  ): Promise<T> {
    const cachedData = await this.cacheService.get<T>(cacheKey);
    if (cachedData !== null) {
      this.logger.info(`Retrieved data from cache for key: ${cacheKey}`);
      return cachedData;
    }

    const data = await fetchFunction();
    await this.cacheService.set(cacheKey, data, expirationTime);
    return data;
  }
}
