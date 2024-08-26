import type { Db } from 'mongodb';

export interface IMongoDbClient {
  connect(): Promise<void>;
  getDb(): Db;
  close(): Promise<void>;
}
