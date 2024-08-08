// test/e2e-setup.ts
import { MongoClient } from 'mongodb';

import { config } from '@/config/config';

let mongoClient: MongoClient;

beforeAll(async () => {
  mongoClient = new MongoClient(
    process.env.DATABASE_URL || 'mongodb://localhost:27018/myapp_test',
  );
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
