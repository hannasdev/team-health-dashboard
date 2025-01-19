// src/data/repositories/RepositoryRepository/RepositoryRepository.ts
import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';

import { RepositoryStatus } from '../../../interfaces/index.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IRepository,
  IRepositoryFilters,
  IRepositoryPaginatedResponse,
  ICacheService,
  ILogger,
  IRepositoryRepository,
  IRepositoryDetails,
} from '../../../interfaces/index.js';

@injectable()
export class RepositoryRepository implements IRepositoryRepository {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @inject(TYPES.RepositoryModel)
    private readonly model: mongoose.Model<IRepository>,
    @inject(TYPES.CacheService)
    private readonly cacheService: ICacheService,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
  ) {}

  public async create(details: IRepositoryDetails): Promise<IRepository> {
    const repository = new this.model({
      ...details,
      fullName: `${details.owner}/${details.name}`,
      updatedAt: new Date(),
      settings: {
        syncEnabled: true,
        branchPatterns: ['*'],
        labelPatterns: ['*'],
      },
    });

    const created = await repository.save();
    await this.cacheService.delete('repositories:all');
    return created;
  }

  public async findById(id: string): Promise<IRepository | null> {
    const cacheKey = `repository:${id}`;
    const cached = await this.cacheService.get<IRepository>(cacheKey);

    if (cached) {
      return cached;
    }

    const repository = await this.model.findById(id).lean();

    if (repository) {
      await this.cacheService.set(cacheKey, repository, this.CACHE_TTL);
    }

    return repository;
  }

  public async findAll(
    filters?: IRepositoryFilters,
  ): Promise<IRepositoryPaginatedResponse> {
    const query = this.buildQuery(filters);
    const sort = this.buildSort(filters?.sort);

    const skip = (filters?.page ?? 0) * (filters?.pageSize ?? 10);
    const limit = filters?.pageSize ?? 10;

    const [total, items] = await Promise.all([
      this.model.countDocuments(query),
      this.model.find(query).sort(sort).skip(skip).limit(limit).lean(),
    ]);

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
    const updated = await this.model.findByIdAndUpdate(
      id,
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { new: true, lean: true },
    );

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
    return this.update(id, {
      status: RepositoryStatus.ARCHIVED,
      settings: { syncEnabled: false },
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
