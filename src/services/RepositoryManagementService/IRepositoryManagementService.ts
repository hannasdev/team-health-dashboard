import type {
  IRepositoryDetails,
  IRepository,
  IRepositoryFilters,
  IRepositoryPaginatedResponse,
  IRepositorySettings,
} from '../../data/repositories/RepositoryRepository/index.js';
import type { RepositoryStatus } from '../../types/index.js';

export interface IRepositoryManagementService {
  addRepository(details: IRepositoryDetails): Promise<IRepository>;
  removeRepository(repoId: string): Promise<void>;
  getRepository(repoId: string): Promise<IRepository>;
  listRepositories(
    filters?: IRepositoryFilters,
  ): Promise<IRepositoryPaginatedResponse>;
  updateRepositoryStatus(
    repoId: string,
    status: RepositoryStatus,
  ): Promise<IRepository>;
  updateRepositorySettings(
    repoId: string,
    settings: Partial<IRepositorySettings>,
  ): Promise<IRepository>;
}
