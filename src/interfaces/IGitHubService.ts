// src/interfaces/IGitHubService.ts
import { ProgressCallback } from '../types/index.js';

import { IFetchDataResult } from './IFetchDataResult.js';

export interface IGitHubService {
  fetchData(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<IFetchDataResult>;
}
