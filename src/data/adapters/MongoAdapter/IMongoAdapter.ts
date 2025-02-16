// src/interfaces/IMongoAdapter.ts
import { FilterQuery, SortOrder, Model } from 'mongoose';

export interface IMongoAdapter<T> {
  setModel(model: Model<any>): void;
  create(data: any): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(
    filters?: FilterQuery<any>,
    sort?: { [key: string]: SortOrder },
    skip?: number,
    limit?: number,
  ): Promise<{ items: T[]; total: number }>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<void>;
  count(filters?: FilterQuery<any>): Promise<number>;
}
