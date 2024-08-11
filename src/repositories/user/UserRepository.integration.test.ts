// src/repositories/user/UserRepository.integration.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Container } from 'inversify';

import { createMockLogger } from '../../__mocks__/mockFactories';
import { Config } from '@/config/config';
import { ILogger, IConfig } from '@/interfaces';
import { User } from '@/models/User';
import { UserRepository } from '@/repositories/user/UserRepository';
import {
  MongoDbClient,
  IMongoDbClient,
} from '@/services/database/MongoDbClient';
import { TYPES } from '@/utils/types';

describe('UserRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let container: Container;
  let userRepository: UserRepository;
  let mongoDbClient: IMongoDbClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    container = new Container();
    container.bind<IConfig>(TYPES.Config).toConstantValue(
      Config.getInstance({
        DATABASE_URL: mongoUri,
        JWT_SECRET: 'test-secret',
        MONGO_CONNECT_TIMEOUT_MS: 5000,
        MONGO_SERVER_SELECTION_TIMEOUT_MS: 5000,
      }),
    );
    container.bind<ILogger>(TYPES.Logger).toConstantValue(createMockLogger());
    container
      .bind<IMongoDbClient>(TYPES.MongoDbClient)
      .to(MongoDbClient)
      .inSingletonScope();
    container.bind<UserRepository>(UserRepository).toSelf();

    mongoDbClient = container.get<IMongoDbClient>(TYPES.MongoDbClient);
    await mongoDbClient.connect();

    userRepository = container.get<UserRepository>(UserRepository);
  }, 30000);

  afterAll(async () => {
    await mongoDbClient.close();
    await mongoServer.stop();
  });

  it('should create a new user', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const user = await userRepository.create(email, password);

    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe(email);
    expect(user.password).toBe(password);
  });

  it('should find a user by email', async () => {
    const email = 'find@example.com';
    const password = 'findpassword';

    await userRepository.create(email, password);
    const foundUser = await userRepository.findByEmail(email);

    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe(email);
  });

  it('should return undefined for non-existent user', async () => {
    const nonExistentEmail = 'nonexistent@example.com';
    const nonExistentUser = await userRepository.findByEmail(nonExistentEmail);

    expect(nonExistentUser).toBeUndefined();
  });
});
