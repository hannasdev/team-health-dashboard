import { RepositoryStatus } from '../../../types/index.js';

export interface IRepositoryDocument extends Document {
  owner: string;
  name: string;
  fullName: string;
  credentials: {
    type: 'token' | 'oauth';
    value: string;
    lastValidated?: Date;
  };
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  settings: {
    syncEnabled: boolean;
    syncInterval?: number;
    branchPatterns: string[];
    labelPatterns: string[];
  };
  metadata: {
    isPrivate: boolean;
    description?: string;
    defaultBranch: string;
    topics?: string[];
    language?: string;
  };
}
