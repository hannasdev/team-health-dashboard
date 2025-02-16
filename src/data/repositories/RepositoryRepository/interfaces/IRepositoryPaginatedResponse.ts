import type { IRepository } from './IRepository.js';

export interface IRepositoryPaginatedResponse {
  items: IRepository[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
