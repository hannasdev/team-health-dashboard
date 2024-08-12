// src/interfaces/IGitHubRepository.ts

import { ProgressCallback } from '../types/index.js';

import { IPullRequest } from './IPullRequest.js';

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
