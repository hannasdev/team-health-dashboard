// BaseDataSource.ts
// Abstract Class

import { injectable, inject } from 'inversify';

import { ProgressCallback } from '@/types';

import {
  ICacheService,
  IFetchDataResult,
  IDataSource,
  IConfig,
  IError,
} from '../../interfaces';
import { Logger } from '../../utils/Logger';
import { TYPES } from '../../utils/types';

@injectable()
export abstract class BaseService implements IDataSource {
  constructor(
    @inject(TYPES.Logger) protected logger: Logger,
    @inject(TYPES.CacheService) protected cacheService: ICacheService,
    @inject(TYPES.Config) protected config: IConfig,
  ) {}

  abstract fetchData(
    progressCallback?: ProgressCallback,
    params?: Record<string, any>,
  ): Promise<IFetchDataResult>;

  protected abstract getCacheKey(params?: Record<string, any>): string;

  protected async getDataWithCache<T>(
    params: Record<string, any> | undefined,
    fetchFunction: () => Promise<T>,
    expirationTime: number = 3600, // 1 hour default
  ): Promise<T> {
    const cacheKey = this.getCacheKey(params);
    try {
      const cachedData = this.cacheService.get<T>(cacheKey);
      if (cachedData) {
        this.logger.info(`Retrieved data from cache for key: ${cacheKey}`);
        return cachedData;
      }

      const data = await fetchFunction();
      this.cacheService.set(cacheKey, data, expirationTime);
      return data;
    } catch (error) {
      this.logger.error(
        `Error in getDataWithCache for key ${cacheKey}:`,
        error as Error,
      );
      throw error;
    }
  }

  protected handleError(error: unknown, source: string): IError {
    this.logger.error(`Error fetching data from ${source}:`, error as Error);
    return {
      source,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
