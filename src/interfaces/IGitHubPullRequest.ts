import type { Document } from 'mongoose';

// This is the interface for the GitHubPullRequest model
export interface IGitHubPullRequest extends Document {
  id: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  mergedAt: Date | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  processed: boolean;
  processedAt: Date | null;
}
