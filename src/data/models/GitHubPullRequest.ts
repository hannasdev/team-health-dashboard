// src/data/models/GitHubPullRequest.ts
import { Schema, model } from 'mongoose';

import type { IGitHubPullRequest } from '../../interfaces/index.js';

const GitHubPullRequestSchema = new Schema<IGitHubPullRequest>({
  number: { type: Number, required: true },
  title: { type: String, required: true },
  state: { type: String, required: true, enum: ['open', 'closed', 'merged'] },
  author: { type: String, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  closedAt: { type: Date },
  mergedAt: { type: Date },
  additions: { type: Number, required: true },
  deletions: { type: Number, required: true },
  changedFiles: { type: Number, required: true },
  processed: { type: Boolean, default: false },
  processedAt: { type: Date, default: null },
});

export const GitHubPullRequest = model<IGitHubPullRequest>(
  'GitHubPullRequest',
  GitHubPullRequestSchema,
);
