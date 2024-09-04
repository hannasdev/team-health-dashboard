// src/interfaces/IGitHubRepository.ts

import { IPullRequest } from './IPullRequest.js';
import { ProgressCallback } from '../types/index.js';

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
  cancelOperation(): void;
}
