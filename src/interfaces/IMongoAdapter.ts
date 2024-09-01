// src/interfaces/IMongoAdapter.ts

import { Collection, Db } from 'mongodb';

export interface IMongoAdapter {
  getCollection(name: string): Collection;
  getDb(): Db;
}
