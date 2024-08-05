// IDataSource.ts
import { ProgressCallback } from '@/types';

import { IFetchDataResult } from './IFetchDataResult';

export interface IDataSource {
  fetchData(progressCallback?: ProgressCallback): Promise<IFetchDataResult>;
}
