// src/interfaces/IMongoDbClient.ts

import { Connection } from 'mongoose';

export interface IMongoDbClient {
  connect(): Promise<void>;
  getDb(): Connection;
  close(): Promise<void>;
}
