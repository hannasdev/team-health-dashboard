// src/interfaces/IGitHubRepository.ts
import { MetricModel } from '../../../models/metricModel/index.js';

import type { IPullRequest } from './index.js';
import type { IMetricDocument } from '../../../models/metricModel/index.js';

// IGitHubRepository.ts
export interface IGitHubRepository {
  fetchPullRequests(
    timePeriod: number,
    credentials: {
      owner: string;
      name: string;
      token: string;
    },
  ): Promise<{
    pullRequests: IPullRequest[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }>;
  storeRawPullRequests(pullRequests: IPullRequest[]): Promise<void>;
  getRawPullRequests(page: number, pageSize: number): Promise<IPullRequest[]>;
  storeProcessedMetrics(metrics: IMetricDocument[]): Promise<void>;
  getProcessedMetrics(page: number, pageSize: number): Promise<MetricModel[]>;
  getTotalPRCount(): Promise<number>;
  syncPullRequests(
    timePeriod: number,
    credentials: {
      owner: string;
      name: string;
      token: string;
    },
  ): Promise<void>;
  markPullRequestsAsProcessed(ids: string[]): Promise<void>;
  deleteAllMetrics(): Promise<void>;
  resetProcessedFlags(): Promise<void>;
  deleteAllPullRequests(): Promise<void>;
}
