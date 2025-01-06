import type {
  IRepository,
  IRepositoryDetails,
  IRepositoryFilters,
  IRepositoryPaginatedResponse,
} from './index.js';

export interface IRepositoryRepository {
  create(details: IRepositoryDetails): Promise<IRepository>; // Keep as is
  findById(id: string): Promise<IRepository | null>;
  findAll(filters?: IRepositoryFilters): Promise<IRepositoryPaginatedResponse>; // Update return type
  update(id: string, updates: Partial<IRepository>): Promise<IRepository>; // Update parameter type
  markAsArchived(id: string): Promise<IRepository>;
  delete(id: string): Promise<void>; // Keep for future use cases
}
