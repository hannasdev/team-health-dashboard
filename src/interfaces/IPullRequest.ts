// src/interfaces/IPullRequest.ts

export interface IPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: {
    login: string;
  };
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  commits: {
    totalCount: number;
  };
  additions: number;
  deletions: number;
  changedFiles: number;
  baseRefName: string;
  baseRefOid: string;
  headRefName: string;
  headRefOid: string;
}
