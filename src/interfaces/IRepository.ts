// Enum for repository status to ensure type safety
export enum RepositoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  VALIDATION_PENDING = 'validation_pending',
  VALIDATION_FAILED = 'validation_failed',
}

// Main repository interface
export interface IRepository {
  id: string;
  owner: string;
  name: string;
  fullName: string; // Computed as `${owner}/${name}`
  credentials?: {
    type: 'token' | 'oauth';
    value: string; // Encrypted
    lastValidated?: Date;
  };
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  metadata?: {
    isPrivate: boolean;
    description?: string;
    defaultBranch: string;
    topics?: string[];
    language?: string;
  };
  settings?: {
    syncEnabled: boolean;
    syncInterval?: number; // in minutes
    branchPatterns?: string[]; // Patterns for branches to include/exclude
    labelPatterns?: string[]; // Patterns for labels to include/exclude
  };
}
