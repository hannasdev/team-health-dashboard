// src/interfaces/IGitHubRepository.ts
import { ProgressCallback } from '@/types';

import { IPullRequest } from './IPullRequest';

export interface IGitHubRepository {
  fetchPullRequests: (
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ) => Promise<IPullRequest[]>;
}
