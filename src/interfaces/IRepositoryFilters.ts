import type { RepositoryStatus, IRepository } from './IRepository.js';

export interface IRepositoryFilters {
  status?: RepositoryStatus | RepositoryStatus[];
  owner?: string;
  search?: string; // Search in name, fullName, description
  syncEnabled?: boolean;
  createdBefore?: Date;
  createdAfter?: Date;
  lastSyncBefore?: Date;
  lastSyncAfter?: Date;
  sort?: {
    field: keyof IRepository | 'lastSync';
    order: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
  includeMetadata?: boolean;
  includeSettings?: boolean;
}
