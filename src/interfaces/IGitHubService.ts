// src/interfaces/IGitHubService.ts
import { IFetchDataResult } from './IFetchDataResult.js';
import { ProgressCallback } from '../types/index.js';

export interface IGitHubService {
  fetchData(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<IFetchDataResult>;
}
