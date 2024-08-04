// src/repositories/user/UserRepository.ts
import { injectable } from 'inversify';
import { MongoClient, Db } from 'mongodb';

import { config } from '../../config/config';
import { User } from '../../models/User';

@injectable()
export class UserRepository {
  private db!: Db;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    try {
      const client = await MongoClient.connect(config.DATABASE_URL);
      this.db = client.db();
    } catch (error) {
      console.error('Failed to connect to the database', error);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    await this.ensureDbConnection();
    const user = await this.db.collection('users').findOne({ email });
    if (!user) {
      return undefined;
    }
    return new User(user._id.toString(), user.email, user.password);
  }

  async create(email: string, password: string): Promise<User> {
    await this.ensureDbConnection();
    const result = await this.db
      .collection('users')
      .insertOne({ email, password });
    return new User(result.insertedId.toString(), email, password);
  }

  private async ensureDbConnection() {
    if (!this.db) {
      await this.initializeDb();
    }
  }
}
