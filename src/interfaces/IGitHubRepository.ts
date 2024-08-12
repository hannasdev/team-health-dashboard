// src/interfaces/IGitHubRepository.ts

import type { IPullRequest } from './IPullRequest.js';
import type { ProgressCallback } from '../types/index.js';

export interface IGitHubRepository {
  fetchPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ): Promise<{
    pullRequests: IPullRequest[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }>;
}
