import type {
  IRepository,
  IRepositoryDetails,
  IRepositoryFilters,
  IRepositoryPaginatedResponse,
} from './index.js';

export interface IRepositoryRepository {
  create(details: IRepositoryDetails): Promise<IRepository>;
  findById(id: string): Promise<IRepository | null>;
  findAll(filters?: IRepositoryFilters): Promise<IRepositoryPaginatedResponse>;
  update(id: string, updates: Partial<IRepository>): Promise<IRepository>;
  markAsArchived(id: string): Promise<IRepository>;
  delete(id: string): Promise<void>;
}
