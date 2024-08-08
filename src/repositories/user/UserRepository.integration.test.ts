const mockConfig = createMockConfig();

jest.mock('@/config/config', () => ({
  config: mockConfig,
}));

import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createMockConfig, createMockLogger } from '@/__mocks__/mockFactories';
import { config } from '@/config/config';
import { ILogger } from '@/interfaces';
import { User } from '@/models/User';
import { UserRepository } from '@/repositories/user/UserRepository';

jest.mock('@/config/config', () => ({
  config: createMockConfig(),
}));

describe('UserRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let userRepository: UserRepository;
  let mockLogger: ILogger;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    mongoClient = await MongoClient.connect(mongoUri);
    mockConfig.DATABASE_URL = mongoUri;
    mockLogger = createMockLogger();
  }, 30000);

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const db = mongoClient.db();
    await db.collection('users').deleteMany({});
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

  it('should log database connection failure', async () => {
    const originalUrl = mockConfig.DATABASE_URL;
    mockConfig.DATABASE_URL = 'mongodb://localhost:12345';

    const errorRepository = new UserRepository(mockLogger, mockConfig);

    try {
      await errorRepository.waitForConnection();
    } catch (error) {
      // Expected error, do nothing
    }

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to connect to the database',
      expect.any(Error),
    );

    mockConfig.DATABASE_URL = originalUrl;
    await errorRepository.close();
  }, 10000); // Increase timeout to 10 seconds

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
