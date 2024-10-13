// src/interfaces/IGitHubRepository.ts
import type { IPullRequest, IMetric } from './index.js';

// IGitHubRepository.ts
export interface IGitHubRepository {
  fetchPullRequests(timePeriod: number): Promise<{
    pullRequests: IPullRequest[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }>;
  storeRawPullRequests(pullRequests: IPullRequest[]): Promise<void>;
  getRawPullRequests(page: number, pageSize: number): Promise<IPullRequest[]>;
  storeProcessedMetrics(metrics: IMetric[]): Promise<void>;
  getProcessedMetrics(page: number, pageSize: number): Promise<IMetric[]>;
  getTotalPRCount(): Promise<number>;
  syncPullRequests(timePeriod: number): Promise<void>;
  markPullRequestsAsProcessed(ids: string[]): Promise<void>;
  deleteAllMetrics(): Promise<void>;
  resetProcessedFlags(): Promise<void>;
}
