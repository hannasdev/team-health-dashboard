import { injectable } from 'inversify';

import type { IMongoDbClient } from '../../interfaces/index.js';

export function createMockMongoDbClient(): jest.Mocked<IMongoDbClient> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    getDb: jest.fn().mockReturnValue({}),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

@injectable()
export class MockMongoDbClient implements IMongoDbClient {
  private db: any = {
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'mockId' }),
      // Add other methods as needed
    }),
  };

  connect = jest.fn().mockResolvedValue(undefined);
  getDb = jest.fn().mockReturnValue(this.db);
  close = jest.fn().mockResolvedValue(undefined);
}
