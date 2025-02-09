// src/data/adapters/MongoDBAdapter.ts
import { injectable, inject } from 'inversify';
import { FilterQuery, Model, SortOrder, Types } from 'mongoose';
import { TYPES } from '../../../utils/types.js';
import { AppError } from '../../../utils/errors.js';
import type {
  IMongoAdapter,
  IRepository,
  IRepositoryDetails,
} from '../../../interfaces/index.js';
import { RepositoryStatus } from '../../../interfaces/index.js';
import type { ILogger } from '../../../interfaces/index.js';

interface RepositoryMetadata {
  isPrivate: boolean;
  description?: string;
  defaultBranch: string;
  topics?: string[];
  language?: string;
}

interface IRepositoryDocumentData {
  _id: Types.ObjectId | string;
  name: string;
  owner: string;
  fullName: string;
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    syncEnabled: boolean;
    branchPatterns: string[];
    labelPatterns: string[];
  };
  metadata: RepositoryMetadata;
}

export interface IRepositoryDocument
  extends Document,
    IRepositoryDocumentData {}
// Interface for lean (plain) document
type LeanDocument = Omit<IRepositoryDocument, keyof Document> &
  IRepositoryDocumentData;

@injectable()
export class MongoAdapter<T extends IRepository> implements IMongoAdapter<T> {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  public setModel(model: Model<IRepositoryDocument>): void {
    this.model = model;
  }

  private model!: Model<IRepositoryDocument>;

  public async create(data: IRepositoryDetails): Promise<T> {
    try {
      const entity = new this.model(this.toPersistence(data));
      const saved = await entity.save();
      return this.toDomain(saved.toObject()) as T;
    } catch (error) {
      this.logger.error('Error creating entity:', error as Error);
      throw new AppError(
        500,
        `Failed to create entity: ${(error as Error).message}`,
      );
    }
  }

  public async findById(id: string): Promise<T | null> {
    try {
      const entity = await this.model.findById(id).lean().exec();
      return entity ? (this.toDomain(entity) as T) : null;
    } catch (error) {
      this.logger.error('Error finding entity by id:', error as Error);
      throw new AppError(
        500,
        `Failed to find entity by id: ${(error as Error).message}`,
      );
    }
  }

  public async findAll(
    filters?: FilterQuery<IRepositoryDocument>,
    sort?: { [key: string]: SortOrder },
    skip?: number,
    limit?: number,
  ): Promise<{ items: T[]; total: number }> {
    try {
      const queryFilters = filters || {};
      const total = await this.model.countDocuments(queryFilters).exec();

      let query = this.model.find(queryFilters);

      if (sort) {
        query = query.sort(sort);
      }

      if (typeof skip === 'number') {
        query = query.skip(skip);
      }

      if (typeof limit === 'number') {
        query = query.limit(limit);
      }

      const items = await query.lean().exec();

      return {
        items: items.map(item => this.toDomain(item) as T),
        total,
      };
    } catch (error) {
      this.logger.error('Error finding all entities:', error as Error);
      throw new AppError(
        500,
        `Failed to find all entities: ${(error as Error).message}`,
      );
    }
  }

  public async update(id: string, updates: Partial<T>): Promise<T | null> {
    try {
      const updatedEntity = await this.model
        .findByIdAndUpdate(
          id,
          { $set: { ...updates, updatedAt: new Date() } },
          { new: true, lean: true },
        )
        .lean()
        .exec();
      return updatedEntity ? (this.toDomain(updatedEntity) as T) : null;
    } catch (error) {
      this.logger.error('Error updating entity:', error as Error);
      throw new AppError(
        500,
        `Failed to update entity: ${(error as Error).message}`,
      );
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await this.model.findByIdAndDelete(id).exec();
    } catch (error) {
      this.logger.error('Error deleting entity:', error as Error);
      throw new AppError(
        500,
        `Failed to delete entity: ${(error as Error).message}`,
      );
    }
  }

  public async count(
    filters?: FilterQuery<IRepositoryDocument>,
  ): Promise<number> {
    try {
      return await this.model.countDocuments(filters || {}).exec();
    } catch (error) {
      this.logger.error('Error counting entities:', error as Error);
      throw new AppError(
        500,
        `Failed to count entities: ${(error as Error).message}`,
      );
    }
  }

  private toDomain(raw: LeanDocument): IRepository {
    return {
      id: raw._id.toString(),
      name: raw.name,
      owner: raw.owner,
      fullName: raw.fullName,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      settings: raw.settings,
      metadata: {
        isPrivate: raw.metadata.isPrivate,
        defaultBranch: raw.metadata.defaultBranch,
        description: raw.metadata.description,
        topics: raw.metadata.topics,
        language: raw.metadata.language,
      },
    };
  }

  private toPersistence(
    details: IRepositoryDetails,
  ): Partial<IRepositoryDocument> {
    return {
      ...details,
      fullName: `${details.owner}/${details.name}`,
      updatedAt: new Date(),
      settings: {
        syncEnabled: true,
        branchPatterns: ['*'],
        labelPatterns: ['*'],
      },
      metadata: {
        isPrivate: details.metadata?.isPrivate ?? false,
        defaultBranch: details.metadata?.defaultBranch ?? 'main',
        description: details.metadata?.description,
        topics: details.metadata?.topics,
        language: details.metadata?.language,
      },
    };
  }
}
