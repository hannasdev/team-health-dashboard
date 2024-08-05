// src/interfaces/IGitHubClient.ts
import { ProgressCallback } from '@/types';

import { IPullRequest } from './IPullRequest';
export interface IGitHubClient {
  fetchPullRequests(
    owner: string,
    repo: string,
    timePeriod: number,
    page: number,
    progressCallback?: ProgressCallback,
  ): Promise<IPullRequest[]>;
}
