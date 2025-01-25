// src/adapters/MongoAdapter.ts
import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';

import { TYPES } from '../../../utils/types.js';

import type {
  IMongoAdapter,
  IMongoDbClient,
} from '../../../interfaces/index.js';

@injectable()
export class MongoAdapter implements IMongoAdapter {
  constructor(
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
  ) {}

  public getCollection(name: string): mongoose.Model<any> {
    return mongoose.model(name);
  }

  public getDb(): mongoose.Connection {
    return this.mongoDbClient.getDb();
  }
}
