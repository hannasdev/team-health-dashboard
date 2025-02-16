// src/data/models/Repository.ts
import mongoose, { Schema } from 'mongoose';

import { RepositoryStatus } from '../../../types/index.js';

import type { IRepositoryDocument } from './IRepositoryDocument.js';

const RepositorySchema = new Schema<IRepositoryDocument>({
  owner: { type: String, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  credentials: {
    type: { type: String, enum: ['token', 'oauth'], required: true },
    value: { type: String, required: true },
    lastValidated: { type: Date },
  },
  status: {
    type: String,
    enum: Object.values(RepositoryStatus),
    default: RepositoryStatus.ACTIVE,
    required: true,
  },
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date, default: Date.now, required: true },
  lastSyncAt: { type: Date },
  metadata: {
    isPrivate: { type: Boolean, default: false },
    description: { type: String },
    defaultBranch: { type: String, default: 'main' },
    topics: [String],
    language: { type: String },
  },
  settings: {
    syncEnabled: { type: Boolean, default: true },
    syncInterval: { type: Number },
    branchPatterns: { type: [String], default: ['*'] },
    labelPatterns: { type: [String], default: ['*'] },
  },
});

export const RepositoryModel = mongoose.model<IRepositoryDocument>(
  'Repository',
  RepositorySchema,
);
