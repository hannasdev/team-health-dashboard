// src/__mocks__/mockAdapters.ts

import { injectable } from 'inversify';

import type {
  IGitHubClient,
  IGoogleSheetsClient,
  IMongoDbClient,
  IEventEmitter,
} from '../interfaces/index.js';

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

@injectable()
export class MockGitHubAdapter implements IGitHubClient {
  graphql = jest.fn().mockResolvedValue({
    repository: {
      pullRequests: {
        nodes: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  });
}

@injectable()
export class MockGoogleSheetsAdapter implements IGoogleSheetsClient {
  getValues = jest.fn().mockResolvedValue({
    data: {
      values: [
        [
          'Timestamp',
          'Metric Category',
          'Metric Name',
          'Value',
          'Unit',
          'Additional Info',
        ],
        ['2023-01-01', 'Test Category', 'Test Metric', '10', 'count', ''],
      ],
    },
  });
}

export function createMockEventEmitter(): jest.Mocked<IEventEmitter> {
  return {
    on: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
  };
}
