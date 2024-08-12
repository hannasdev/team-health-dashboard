// src/interfaces/IGitHubService.ts
import type { IFetchDataResult } from './IFetchDataResult.js';
import type { ProgressCallback } from '../types/index.js';

export interface IGitHubService {
  fetchData(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<IFetchDataResult>;
}
