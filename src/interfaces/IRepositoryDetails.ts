// src/interfaces/IRepositoryDetails.ts

import { RepositoryStatus } from './IRepository';
export interface IRepositoryDetails {
  owner: string;
  name: string;
  credentials?: {
    type: 'token' | 'oauth';
    value: string;
  };
  status: RepositoryStatus;
  createdAt: Date;
  lastSyncAt?: Date;
  metadata?: {
    isPrivate: boolean;
    description?: string;
    defaultBranch: string;
    topics?: string[];
    language?: string;
  };
}
