import mongoose from 'mongoose';

export interface IMongoClientService {
  connect(): Promise<void>;
  getDb(): mongoose.Connection;
  close(): Promise<void>;
}
