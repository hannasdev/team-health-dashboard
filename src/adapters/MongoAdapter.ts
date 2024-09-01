// src/adapters/MongoAdapter.ts

import { injectable, inject } from 'inversify';
import { Collection, Db } from 'mongodb';

import { TYPES } from '../utils/types.js';

import type { IMongoAdapter, IMongoDbClient } from '../interfaces/index.js';

@injectable()
export class MongoAdapter implements IMongoAdapter {
  constructor(
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
  ) {}

  getCollection(name: string): Collection {
    return this.getDb().collection(name);
  }

  getDb(): Db {
    return this.mongoDbClient.getDb();
  }
}
