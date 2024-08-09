// test/e2e-setup.ts
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

import { Config } from '@/config/config';

dotenv.config({ path: '.env.test' });
const config = Config.getInstance({
  DATABASE_URL:
    process.env.TEST_DATABASE_URL || 'mongodb://localhost:27018/myapp_test',
});

let mongoClient: MongoClient;

beforeAll(async () => {
  mongoClient = new MongoClient(config.DATABASE_URL);
  await mongoClient.connect();
});

afterAll(async () => {
  await mongoClient.close();
});

beforeEach(async () => {
  const db = mongoClient.db();
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
});
