// src/interfaces/IGitHubService.ts
import { ProgressCallback } from '@/types';
import { IFetchDataResult } from './IFetchDataResult';

export interface IGitHubService {
  fetchData(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<IFetchDataResult>;
}
