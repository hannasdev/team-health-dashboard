// src/data/models/Repository.ts
import mongoose, { Schema } from 'mongoose';

import { IRepository, RepositoryStatus } from '../../interfaces/IRepository';

const RepositorySchema = new Schema<IRepository>({
  owner: { type: String, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  credentials: {
    type: {
      type: String,
      enum: ['token', 'oauth'],
      required: true,
    },
    value: { type: String, required: true },
    lastValidated: { type: Date },
  },
  status: {
    type: String,
    enum: Object.values(RepositoryStatus),
    required: true,
  },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  lastSyncAt: { type: Date },
  metadata: {
    isPrivate: { type: Boolean },
    description: { type: String },
    defaultBranch: { type: String },
    topics: [String],
    language: { type: String },
  },
  settings: {
    syncEnabled: { type: Boolean, default: true },
    syncInterval: { type: Number },
    branchPatterns: [String],
    labelPatterns: [String],
  },
});

export const Repository = mongoose.model<IRepository>(
  'Repository',
  RepositorySchema,
);
