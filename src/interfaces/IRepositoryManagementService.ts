import type {
  IRepositoryDetails,
  IRepository,
  IRepositoryFilters,
  RepositoryStatus,
  IRepositoryPaginatedResponse,
} from './index.js';

export interface IRepositoryManagementService {
  addRepository(details: IRepositoryDetails): Promise<IRepository>;
  removeRepository(repoId: string): Promise<void>;
  getRepository(repoId: string): Promise<IRepository>;
  listRepositories(
    filters?: IRepositoryFilters,
  ): Promise<IRepositoryPaginatedResponse>;
  validateRepository(details: IRepositoryDetails): Promise<IRepositoryDetails>;
  updateRepositoryStatus(
    repoId: string,
    status: RepositoryStatus,
  ): Promise<IRepository>;
}
