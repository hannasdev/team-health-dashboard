export interface IRepositoryCredentials {
  type: 'token' | 'oauth';
  value: string;
  lastValidated?: Date;
}

export interface IRepositorySettings {
  syncEnabled: boolean;
  branchPatterns: string[];
  labelPatterns: string[];
  syncInterval?: number;
}

export interface IRepositoryMetadata {
  isPrivate: boolean;
  defaultBranch: string;
  description?: string;
  topics?: string[];
  language?: string;
}

export interface IRepositoryDetails {
  owner: string;
  name: string;
  credentials: IRepositoryCredentials;
  settings?: Partial<IRepositorySettings>;
  metadata?: Partial<IRepositoryMetadata>;
  status?: RepositoryStatus;
}

// Enum for repository status to ensure type safety
export enum RepositoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  VALIDATION_PENDING = 'validation_pending',
  VALIDATION_FAILED = 'validation_failed',
}

// Main repository interfaceexport interface IRepository extends IRepositoryDetails {
export interface IRepository extends IRepositoryDetails {
  id: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  settings: IRepositorySettings;
  metadata: IRepositoryMetadata;
}
