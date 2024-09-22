import { injectable } from 'inversify';
import mongoose from 'mongoose';

import type { IMongoDbClient } from '../../interfaces/index.js';

@injectable()
export class MockMongoDbClient implements IMongoDbClient {
  connect: jest.Mock;
  getDb: jest.Mock;
  close: jest.Mock;

  constructor() {
    const connection = mongoose.createConnection();

    this.connect = jest.fn().mockResolvedValue(undefined);
    this.getDb = jest.fn().mockReturnValue(connection);
    this.close = jest.fn().mockResolvedValue(undefined);
  }
}

export function createMockMongoDbClient(): jest.Mocked<IMongoDbClient> {
  return new MockMongoDbClient() as jest.Mocked<IMongoDbClient>;
}
