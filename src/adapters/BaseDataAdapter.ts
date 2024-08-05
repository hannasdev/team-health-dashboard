import { injectable, inject } from 'inversify';

import { IDataAdapter, IConfig, IFetchDataResult } from '@/interfaces';
import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

@injectable()
export abstract class BaseDataAdapter implements IDataAdapter {
  constructor(
    @inject(TYPES.Config) protected config: IConfig,
    @inject(TYPES.Logger) protected logger: Logger,
  ) {}

  abstract fetchData(
    progressCallback?: ProgressCallback,
  ): Promise<IFetchDataResult>;

  protected abstract getCacheKey(): string;

  // Add common methods for all adapters
}
