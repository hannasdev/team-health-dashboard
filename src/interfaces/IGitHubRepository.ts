// src/interfaces/IGitHubRepository.ts

import { ProgressCallback } from '@/types';

import { IPullRequest } from './IPullRequest';

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
