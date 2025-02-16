// src/data/repositories/RepositoryRepository/RepositoryRepository.ts
import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';

import { RepositoryStatus } from '../../../types/index.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IRepository,
  IRepositoryDetails,
  IRepositoryRepository,
  IRepositoryFilters,
  IRepositoryPaginatedResponse,
} from './interfaces/index.js';
import type { ICacheService } from '../../../cross-cutting/CacheService/ICacheService.js';
import type { ILogger } from '../../../cross-cutting/Logger/ILogger.js';
import type { IMongoAdapter } from '../../adapters/MongoAdapter/index.js';

@injectable()
export class RepositoryRepository implements IRepositoryRepository {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @inject(TYPES.MongoAdapter)
    private readonly mongoAdapter: IMongoAdapter<IRepository>,
    @inject(TYPES.CacheService)
    private readonly cacheService: ICacheService,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
  ) {}

  public async create(details: IRepositoryDetails): Promise<IRepository> {
    try {
      const created = await this.mongoAdapter.create(details);
      await this.cacheService.delete('repositories:all');
      return created;
    } catch (error) {
      this.logger.error('Error creating repository:', error as Error);
      throw error;
    }
  }

  public async findById(id: string): Promise<IRepository | null> {
    const cacheKey = `repository:${id}`;
    const cached = await this.cacheService.get<IRepository>(cacheKey);

    if (cached) {
      return cached;
    }

    const repository = await this.mongoAdapter.findById(id);

    if (repository) {
      await this.cacheService.set(cacheKey, repository, this.CACHE_TTL);
      return repository;
    }

    return null;
  }

  public async findAll(
    filters?: IRepositoryFilters,
  ): Promise<IRepositoryPaginatedResponse> {
    const query = this.buildQuery(filters);
    const sort = this.buildSort(filters?.sort);

    const skip = (filters?.page ?? 0) * (filters?.pageSize ?? 10);
    const limit = filters?.pageSize ?? 10;

    const { items, total } = await this.mongoAdapter.findAll(
      query,
      sort,
      skip,
      limit,
    );

    return {
      items,
      total,
      page: filters?.page ?? 0,
      pageSize: filters?.pageSize ?? 10,
      hasMore: skip + items.length < total,
    };
  }

  public async update(
    id: string,
    updates: Partial<IRepository>,
  ): Promise<IRepository> {
    const updated = await this.mongoAdapter.update(id, updates);

    if (!updated) {
      throw new Error('Repository not found');
    }

    // Clear cache entries
    await this.cacheService.delete(`repository:${id}`);
    await this.cacheService.delete('repositories:all');

    return updated;
  }

  public async delete(id: string): Promise<void> {
    // We implement this as required by the interface, but throw error to prevent actual deletion
    throw new Error(
      'Direct deletion is not supported. Use markAsArchived instead.',
    );
  }

  public async markAsArchived(id: string): Promise<IRepository> {
    // Get the current repository to preserve existing settings
    const currentRepo = await this.findById(id);
    if (!currentRepo) {
      throw new Error('Repository not found');
    }

    return this.update(id, {
      status: RepositoryStatus.ARCHIVED,
      settings: {
        ...currentRepo.settings, // Preserve existing settings
        syncEnabled: false, // Only update what we need
      },
    });
  }

  private buildQuery(
    filters?: IRepositoryFilters,
  ): mongoose.FilterQuery<IRepository> {
    const query: mongoose.FilterQuery<IRepository> = {};

    if (filters?.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status;
    }

    if (filters?.owner) {
      query.owner = filters.owner;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { fullName: { $regex: filters.search, $options: 'i' } },
        { 'metadata.description': { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters?.syncEnabled !== undefined) {
      query['settings.syncEnabled'] = filters.syncEnabled;
    }

    if (filters?.createdBefore || filters?.createdAfter) {
      query.createdAt = {};
      if (filters.createdBefore) {
        query.createdAt.$lte = filters.createdBefore;
      }
      if (filters.createdAfter) {
        query.createdAt.$gte = filters.createdAfter;
      }
    }

    return query;
  }

  private buildSort(sort?: IRepositoryFilters['sort']): Record<string, 1 | -1> {
    if (!sort) {
      return { createdAt: -1 };
    }

    return { [sort.field]: sort.order === 'asc' ? 1 : -1 };
  }
}
