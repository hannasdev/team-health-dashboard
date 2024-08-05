import { injectable, inject } from 'inversify';
import { TYPES } from '@/utils/types';
import {
  IDataSourceFacade,
  IDataAdapter,
  ICacheService,
  IFetchDataResult,
} from '@/interfaces';
import { ProgressCallback } from '@/types';

@injectable()
export class DataSourceFacade implements IDataSourceFacade {
  constructor(
    @inject(TYPES.GitHubAdapter) private gitHubAdapter: IDataAdapter,
    @inject(TYPES.GoogleSheetsAdapter)
    private googleSheetsAdapter: IDataAdapter,
    @inject(TYPES.CacheService) private cacheService: ICacheService,
  ) {}

  async fetchAllData(
    progressCallback?: ProgressCallback,
  ): Promise<IFetchDataResult[]> {
    const gitHubData = await this.gitHubAdapter.fetchData(progressCallback);
    const googleSheetsData = await this.googleSheetsAdapter.fetchData(
      progressCallback,
    );
    return [gitHubData, googleSheetsData];
  }

  // Add methods for individual data source fetching if needed
}
