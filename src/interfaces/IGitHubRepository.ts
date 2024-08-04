// src/interfaces/IGitHubRepository.ts
import { IPullRequest } from './IPullRequest';
import { ProgressCallback } from '@/types';

export interface IGitHubRepository {
  fetchPullRequests: (
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ) => Promise<IPullRequest[]>;
}
