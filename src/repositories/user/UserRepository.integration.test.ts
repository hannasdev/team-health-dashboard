import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createMockLogger } from '@/__mocks__/mockFactories';
import { Config } from '@/config/config';
import { ILogger, IConfig } from '@/interfaces';
import { User } from '@/models/User';
import { UserRepository } from '@/repositories/user/UserRepository';

jest.mock('mongodb', () => {
  const actualMongo = jest.requireActual('mongodb');
  return {
    ...actualMongo,
    MongoClient: {
      connect: jest.fn(),
    },
  };
});

describe('UserRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let userRepository: UserRepository;
  let mockLogger: jest.Mocked<ILogger>;
  let mockConfig: IConfig;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    mongoClient = await MongoClient.connect(mongoUri);
    mockConfig = Config.getInstance({
      DATABASE_URL: mongoUri,
      JWT_SECRET: 'test-secret',
    });
    mockLogger = createMockLogger();
  }, 30000);

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    userRepository = new UserRepository(mockLogger, mockConfig);
    await userRepository.waitForConnection();
  }, 10000);

  afterEach(async () => {
    if (userRepository) {
      await userRepository.close();
    }
  });

  it('should log successful database connection', async () => {
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully connected to the database',
    );
  });

  it('should create a new user', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const user = await userRepository.create(email, password);

    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe(email);
    expect(user.password).toBe(password);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `New user created with email: ${email}`,
    );
  });

  it('should find a user by email', async () => {
    const email = 'find@example.com';
    const password = 'findpassword';

    await userRepository.create(email, password);
    const foundUser = await userRepository.findByEmail(email);

    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe(email);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      `User found for email: ${email}`,
    );
  });

  it('should return undefined for non-existent user', async () => {
    const nonExistentEmail = 'nonexistent@example.com';
    const nonExistentUser = await userRepository.findByEmail(nonExistentEmail);

    expect(nonExistentUser).toBeUndefined();
    expect(mockLogger.debug).toHaveBeenCalledWith(
      `User not found for email: ${nonExistentEmail}`,
    );
  });
});
