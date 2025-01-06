// src/interfaces/IRepositoryDetails.ts
export interface IRepositoryDetails {
  owner: string;
  name: string;
  credentials?: {
    type: 'token' | 'oauth';
    value: string;
  };
  status: 'active' | 'inactive' | 'archived';
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
