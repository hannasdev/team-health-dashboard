import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { config } from '@/config/config';
import { User } from '@/models/User';
import { UserRepository } from '@/repositories/user/UserRepository';
import { Logger } from '@/utils/Logger';

describe('UserRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let userRepository: UserRepository;
  let mockLogger: jest.Mocked<Logger>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    mongoClient = await MongoClient.connect(mongoUri);
    config.DATABASE_URL = mongoUri;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const db = mongoClient.db();
    await db.collection('users').deleteMany({});
    jest.clearAllMocks();
    userRepository = new UserRepository(mockLogger);
    // Wait for the database connection to be established
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await userRepository.close();
  });

  it('should log successful database connection', async () => {
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully connected to the database',
    );
  });

  it('should log database connection failure', async () => {
    const originalUrl = config.DATABASE_URL;
    config.DATABASE_URL = 'mongodb://invalid:27017';

    const errorRepository = new UserRepository(mockLogger);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Increase wait time

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to connect to the database',
      expect.any(Error),
    );

    config.DATABASE_URL = originalUrl;
    await errorRepository.close();
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