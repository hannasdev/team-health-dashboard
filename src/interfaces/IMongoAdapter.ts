// src/interfaces/IMongoAdapter.ts
import mongoose from 'mongoose';

export interface IMongoAdapter {
  getCollection(name: string): mongoose.Model<any>;
  getDb(): mongoose.Connection;
}
